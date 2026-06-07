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
