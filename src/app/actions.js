'use server';

import { supabase } from '../lib/supabase';
import { revalidatePath } from 'next/cache';

// Fetch all raw materials
export async function getBahanBaku() {
  try {
    const { data, error } = await supabase
      .from('bahan_baku')
      .select('*')
      .order('nama', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('getBahanBaku error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Add a new raw material
export async function addBahanBaku(formData) {
  try {
    const nama = formData.nama;
    const satuan = formData.satuan;
    const stok = parseFloat(formData.stok) || 0;
    const pakai = parseFloat(formData.pakai) || 0;
    const via = formData.via || 'offline';
    const kirim = parseInt(formData.kirim) || 0;

    if (!nama || !satuan) {
      return { success: false, error: 'Nama dan Satuan wajib diisi!' };
    }

    const { data, error } = await supabase
      .from('bahan_baku')
      .insert([{ nama, satuan, stok, pakai, via, kirim }])
      .select();

    if (error) throw error;

    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    console.error('addBahanBaku error:', error);
    return { success: false, error: error.message };
  }
}

// Update a raw material
export async function updateBahanBaku(id, formData) {
  try {
    const { data, error } = await supabase
      .from('bahan_baku')
      .update({
        nama: formData.nama,
        satuan: formData.satuan,
        stok: parseFloat(formData.stok),
        pakai: parseFloat(formData.pakai),
        via: formData.via,
        kirim: parseInt(formData.kirim)
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    console.error('updateBahanBaku error:', error);
    return { success: false, error: error.message };
  }
}

// Delete a raw material
export async function deleteBahanBaku(id) {
  try {
    const { error } = await supabase
      .from('bahan_baku')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('deleteBahanBaku error:', error);
    return { success: false, error: error.message };
  }
}

// Record usage or purchase activity
export async function catatAktivitas(tipe, bahanId, jumlahVal, tanggalVal) {
  try {
    const jumlah = parseFloat(jumlahVal);
    if (isNaN(jumlah) || jumlah <= 0) {
      return { success: false, error: 'Jumlah harus lebih besar dari 0!' };
    }

    const tanggal = tanggalVal || new Date().toISOString().slice(0, 10);

    // 1. Fetch current ingredient details
    const { data: bahan, error: fetchError } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('id', bahanId)
      .single();

    if (fetchError || !bahan) {
      return { success: false, error: 'Bahan tidak ditemukan!' };
    }

    // 2. Compute new stock
    let newStok = bahan.stok;
    if (tipe === 'pakai') {
      newStok = Math.max(0, bahan.stok - jumlah);
    } else if (tipe === 'beli') {
      newStok = bahan.stok + jumlah;
    } else {
      return { success: false, error: 'Tipe aktivitas tidak valid!' };
    }

    // 3. Update stock in database
    const { error: updateError } = await supabase
      .from('bahan_baku')
      .update({ stok: newStok })
      .eq('id', bahanId);

    if (updateError) throw updateError;

    // 4. Log the activity
    const { error: logError } = await supabase
      .from('riwayat_aktivitas')
      .insert([{
        tipe,
        bahan_id: bahanId,
        nama_bahan: bahan.nama,
        jumlah,
        satuan: bahan.satuan,
        tanggal
      }]);

    if (logError) throw logError;

    revalidatePath('/');
    return { success: true, newStok };
  } catch (error) {
    console.error('catatAktivitas error:', error);
    return { success: false, error: error.message };
  }
}

// Get all activity logs
export async function getRiwayat() {
  try {
    const { data, error } = await supabase
      .from('riwayat_aktivitas')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('getRiwayat error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Clear all activity logs
export async function clearRiwayat() {
  try {
    const { error } = await supabase
      .from('riwayat_aktivitas')
      .delete()
      .gte('created_at', '1970-01-01'); // Deletes all records

    if (error) throw error;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('clearRiwayat error:', error);
    return { success: false, error: error.message };
  }
}

// Batch-record all ngadon (baking session) ingredients at once
export async function catatNgadonHariIni(tanggalVal) {
  try {
    const tanggal = tanggalVal || new Date().toISOString().slice(0, 10);

    // The fixed ngadon recipe
    const ngadonRecipe = [
      { nama: 'dark coklat',   jumlah: 640 },
      { nama: 'milk coklat',   jumlah: 240 },
      { nama: 'mentega',       jumlah: 200 },
      { nama: 'susu uht',      jumlah: 200 },
      { nama: 'tepung terigu', jumlah: 440 },
      { nama: 'telur',         jumlah: 8   },
      { nama: 'gula',          jumlah: 400 },
    ];

    // Fetch all bahan to match by name
    const { data: allBahan, error: fetchErr } = await supabase
      .from('bahan_baku')
      .select('*');

    if (fetchErr) throw fetchErr;

    const results = [];
    const notFound = [];

    for (const item of ngadonRecipe) {
      // Case-insensitive match
      const bahan = allBahan.find(
        (b) => b.nama.toLowerCase().trim() === item.nama.toLowerCase().trim()
      );

      if (!bahan) {
        notFound.push(item.nama);
        continue;
      }

      const newStok = Math.max(0, bahan.stok - item.jumlah);

      // Update stock
      const { error: updateErr } = await supabase
        .from('bahan_baku')
        .update({ stok: newStok })
        .eq('id', bahan.id);

      if (updateErr) throw updateErr;

      // Log activity
      const { error: logErr } = await supabase
        .from('riwayat_aktivitas')
        .insert([{
          tipe: 'pakai',
          bahan_id: bahan.id,
          nama_bahan: bahan.nama,
          jumlah: item.jumlah,
          satuan: bahan.satuan,
          tanggal
        }]);

      if (logErr) throw logErr;

      results.push({ nama: bahan.nama, jumlah: item.jumlah, satuan: bahan.satuan });
    }

    revalidatePath('/');
    return { success: true, results, notFound };
  } catch (error) {
    console.error('catatNgadonHariIni error:', error);
    return { success: false, error: error.message };
  }
}

// Reset and Seed Database with Sweet Salt Menu (16 items)
export async function resetToSweetSaltSeed() {
  try {
    // 1. Delete all activity records first to avoid foreign key errors
    const { error: deleteLogErr } = await supabase
      .from('riwayat_aktivitas')
      .delete()
      .gte('created_at', '1970-01-01');
    if (deleteLogErr) throw deleteLogErr;

    // 2. Delete all ingredients
    const { error: deleteBahanErr } = await supabase
      .from('bahan_baku')
      .delete()
      .gt('id', 0);
    if (deleteBahanErr) throw deleteBahanErr;

    // 3. Define the 16 Sweet Salt ingredients
    const sweetSaltSeedData = [
      { nama: 'dark coklat', satuan: 'kg', stok: 10.0, pakai: 0.5, via: 'offline', kirim: 0 },
      { nama: 'milk coklat', satuan: 'kg', stok: 10.0, pakai: 0.5, via: 'offline', kirim: 0 },
      { nama: 'mentega', satuan: 'kg', stok: 5.0, pakai: 0.3, via: 'offline', kirim: 0 },
      { nama: 'gula', satuan: 'kg', stok: 15.0, pakai: 0.8, via: 'offline', kirim: 0 },
      { nama: 'telur', satuan: 'butir', stok: 120.0, pakai: 10.0, via: 'offline', kirim: 0 },
      { nama: 'tepung terigu', satuan: 'kg', stok: 20.0, pakai: 1.5, via: 'offline', kirim: 0 },
      { nama: 'baking powder', satuan: 'gram', stok: 500.0, pakai: 15.0, via: 'offline', kirim: 0 },
      { nama: 'baking soda', satuan: 'gram', stok: 500.0, pakai: 15.0, via: 'offline', kirim: 0 },
      { nama: 'sendok plastik', satuan: 'pcs', stok: 150.0, pakai: 10.0, via: 'online', kirim: 3 },
      { nama: 'kresek', satuan: 'pcs', stok: 200.0, pakai: 15.0, via: 'online', kirim: 3 },
      { nama: 'packaging', satuan: 'pcs', stok: 100.0, pakai: 8.0, via: 'online', kirim: 7 },
      { nama: 'stiker', satuan: 'pcs', stok: 500.0, pakai: 20.0, via: 'offline', kirim: 0 },
      { nama: 'topping keju', satuan: 'gram', stok: 1000.0, pakai: 50.0, via: 'offline', kirim: 0 },
      { nama: 'topping oreo', satuan: 'gram', stok: 1000.0, pakai: 40.0, via: 'online', kirim: 4 },
      { nama: 'topping matcha glaze', satuan: 'gram', stok: 1000.0, pakai: 30.0, via: 'offline', kirim: 0 },
      { nama: 'topping tiramisu glaze', satuan: 'gram', stok: 1000.0, pakai: 30.0, via: 'offline', kirim: 0 }
    ];

    // 4. Insert seeds
    const { data, error: insertErr } = await supabase
      .from('bahan_baku')
      .insert(sweetSaltSeedData)
      .select();

    if (insertErr) throw insertErr;

    revalidatePath('/');
    return { success: true, count: data.length };
  } catch (error) {
    console.error('resetToSweetSaltSeed error:', error);
    return { success: false, error: error.message };
  }
}

