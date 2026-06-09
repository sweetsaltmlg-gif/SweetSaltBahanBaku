'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Layers, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ShoppingBag, 
  Search,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBahanBaku, 
  addBahanBaku, 
  deleteBahanBaku, 
  catatAktivitas, 
  getRiwayat, 
  clearRiwayat,
  resetToSweetSaltSeed,
  catatNgadonHariIni
} from './actions';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bahan, setBahan] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reset database with 16 Sweet Salt items
  const handleResetSeed = async () => {
    if (!confirm('PERHATIAN: Tindakan ini akan menghapus semua bahan baku & riwayat transaksi saat ini, lalu menggantinya dengan 16 Menu Default Sweet Salt. Anda yakin?')) return;
    setActionLoading(true);
    const res = await resetToSweetSaltSeed();
    setActionLoading(false);
    if (res.success) {
      alert(`Berhasil mereset database! ${res.count} bahan baku Sweet Salt berhasil disinkronkan.`);
      await loadData();
    } else {
      alert(res.error);
    }
  };

  
  // Ngadon state
  const [ngadonTgl, setNgadonTgl] = useState(new Date().toISOString().slice(0, 10));
  const [ngadonLoading, setNgadonLoading] = useState(false);
  const [ngadonResult, setNgadonResult] = useState(null); // { results, notFound } | null

  // Ngadon recipe (displayed in card)
  const NGADON_RECIPE = [
    { nama: 'Dark Chocolate', jumlah: 640, satuan: 'gram' },
    { nama: 'Milk Chocolate', jumlah: 240, satuan: 'gram' },
    { nama: 'Mentega',        jumlah: 200, satuan: 'gram' },
    { nama: 'Susu UHT',       jumlah: 200, satuan: 'ml'   },
    { nama: 'Tepung Terigu',  jumlah: 440, satuan: 'gram' },
    { nama: 'Telur',          jumlah: 8,   satuan: 'butir' },
    { nama: 'Gula',           jumlah: 400, satuan: 'gram' },
  ];

  const handleNgadon = async () => {
    if (!confirm(`Konfirmasi ngadon hari ini (${ngadonTgl})? Stok 7 bahan akan dikurangi sesuai resep.`)) return;
    setNgadonLoading(true);
    const res = await catatNgadonHariIni(ngadonTgl);
    setNgadonLoading(false);
    if (res.success) {
      setNgadonResult(res);
      await loadData();
    } else {
      alert('Gagal mencatat ngadon: ' + res.error);
    }
  };

  // Form states
  const [pakaiBahanId, setPakaiBahanId] = useState('');
  const [pakaiJml, setPakaiJml] = useState('');
  const [pakaiTgl, setPakaiTgl] = useState(new Date().toISOString().slice(0, 10));

  const [beliBahanId, setBeliBahanId] = useState('');
  const [beliJml, setBeliJml] = useState('');
  const [beliTgl, setBeliTgl] = useState(new Date().toISOString().slice(0, 10));

  // Add ingredient form states
  const [newNama, setNewNama] = useState('');
  const [newSatuan, setNewSatuan] = useState('');
  const [newStok, setNewStok] = useState('');
  const [newPakai, setNewPakai] = useState('');
  const [newVia, setNewVia] = useState('offline');
  const [newKirim, setNewKirim] = useState('0');

  // Load data
  const loadData = async () => {
    setLoading(true);
    const resBahan = await getBahanBaku();
    const resLog = await getRiwayat();
    
    if (resBahan.success) {
      setBahan(resBahan.data);
      // Preselect first item in dropdowns if available
      if (resBahan.data.length > 0) {
        setPakaiBahanId(resBahan.data[0].id);
        setBeliBahanId(resBahan.data[0].id);
      }
    }
    if (resLog.success) {
      setLog(resLog.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate status functions
  const getSisaHari = (b) => {
    return b.pakai > 0 ? b.stok / b.pakai : 999;
  };

  const getStatus = (b) => {
    const sisa = getSisaHari(b);
    if (b.via === 'online') {
      if (sisa <= b.kirim) return 'kritis';
      if (sisa <= b.kirim + 2) return 'segera';
      return 'aman';
    } else {
      if (sisa <= 0.5) return 'kritis';
      if (sisa <= 1.5) return 'segera';
      return 'aman';
    }
  };

  // Metrics
  const totalBahan = bahan.length;
  const statusKritis = bahan.filter(b => getStatus(b) === 'kritis').length;
  const statusSegera = bahan.filter(b => getStatus(b) === 'segera').length;
  const statusAman = totalBahan - statusKritis - statusSegera;

  // Actions
  const handleCatatPakai = async (e) => {
    e.preventDefault();
    if (!pakaiBahanId || !pakaiJml || parseFloat(pakaiJml) <= 0) {
      alert('Isi jumlah pemakaian dengan benar!');
      return;
    }
    setActionLoading(true);
    const res = await catatAktivitas('pakai', pakaiBahanId, pakaiJml, pakaiTgl);
    setActionLoading(false);
    if (res.success) {
      setPakaiJml('');
      await loadData();
    } else {
      alert(res.error);
    }
  };

  const handleCatatBeli = async (e) => {
    e.preventDefault();
    if (!beliBahanId || !beliJml || parseFloat(beliJml) <= 0) {
      alert('Isi jumlah pembelian dengan benar!');
      return;
    }
    setActionLoading(true);
    const res = await catatAktivitas('beli', beliBahanId, beliJml, beliTgl);
    setActionLoading(false);
    if (res.success) {
      setBeliJml('');
      await loadData();
    } else {
      alert(res.error);
    }
  };

  const handleTambahBahan = async (e) => {
    e.preventDefault();
    if (!newNama || !newSatuan) {
      alert('Nama dan satuan wajib diisi!');
      return;
    }
    setActionLoading(true);
    const formData = {
      nama: newNama,
      satuan: newSatuan,
      stok: parseFloat(newStok) || 0,
      pakai: parseFloat(newPakai) || 0,
      via: newVia,
      kirim: parseInt(newKirim) || 0
    };
    const res = await addBahanBaku(formData);
    setActionLoading(false);
    if (res.success) {
      setNewNama('');
      setNewSatuan('');
      setNewStok('');
      setNewPakai('');
      setNewVia('offline');
      setNewKirim('0');
      await loadData();
    } else {
      alert(res.error);
    }
  };

  const handleHapusBahan = async (id) => {
    if (!confirm('Hapus bahan ini secara permanen dari database?')) return;
    setActionLoading(true);
    const res = await deleteBahanBaku(id);
    setActionLoading(false);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error);
    }
  };

  const handleClearLog = async () => {
    if (!confirm('Hapus semua riwayat aktivitas dari database?')) return;
    setActionLoading(true);
    const res = await clearRiwayat();
    setActionLoading(false);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error);
    }
  };

  // Filter bahan for search
  const filteredBahan = bahan.filter(b => 
    b.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon">🧁</div>
          <div className="logo-text">
            <h1>SweetSalt</h1>
            <p>Bahan Baku Hub</p>
          </div>
        </div>
        
        <button 
          onClick={loadData} 
          disabled={loading || actionLoading} 
          className="btn btn-sm"
          id="btn-refresh"
          title="Sinkronisasi Database"
          aria-label="Refresh Data"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          <span>Sync</span>
        </button>
      </header>

      {/* Brand Wave Accent */}
      <div className="brand-wave"></div>

      {/* Tabs */}
      <nav className="tabs-navigation" id="navigation-bar">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          id="tab-dashboard"
        >
          <Layers size={16} />
          <span>Dasbor</span>
        </button>
        <button 
          onClick={() => setActiveTab('catat')} 
          className={`tab-btn ${activeTab === 'catat' ? 'active' : ''}`}
          id="tab-catat"
        >
          <ShoppingCart size={16} />
          <span>Catat Aktivitas</span>
        </button>
        <button 
          onClick={() => setActiveTab('kelola')} 
          className={`tab-btn ${activeTab === 'kelola' ? 'active' : ''}`}
          id="tab-kelola"
        >
          <Package size={16} />
          <span>Kelola Bahan</span>
        </button>
        <button 
          onClick={() => setActiveTab('log')} 
          className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          id="tab-log"
        >
          <History size={16} />
          <span>Riwayat</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="content-container">
        {loading && bahan.length === 0 ? (
          <div className="empty-state">
            <RefreshCw className="animate-spin" size={32} />
            <p>Memuat data dari database Supabase...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                {/* Metrics */}
                <div className="metric-grid" id="dashboard-metrics">
                  <div className="metric-card" style={{ '--metric-accent': 'var(--color-info)' }}>
                    <div className="metric-header">
                      <span>Total Bahan</span>
                      <Package size={16} style={{ color: 'var(--color-info)' }} />
                    </div>
                    <div className="metric-value">{totalBahan}</div>
                    <div className="metric-footer">Bahan baku terdaftar</div>
                  </div>
                  
                  <div className="metric-card" style={{ '--metric-accent': 'var(--color-danger)' }}>
                    <div className="metric-header">
                      <span>Stok Kritis</span>
                      <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
                      {statusKritis}
                    </div>
                    <div className="metric-footer">Sisa stok mendesak</div>
                  </div>

                  <div className="metric-card" style={{ '--metric-accent': 'var(--color-warning)' }}>
                    <div className="metric-header">
                      <span>Segera Order</span>
                      <ShoppingBag size={16} style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <div className="metric-value" style={{ color: 'var(--color-warning)' }}>
                      {statusSegera}
                    </div>
                    <div className="metric-footer">Perlu order dalam 2 hari</div>
                  </div>

                  <div className="metric-card" style={{ '--metric-accent': 'var(--color-success)' }}>
                    <div className="metric-header">
                      <span>Aman</span>
                      <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div className="metric-value" style={{ color: 'var(--color-success)' }}>
                      {statusAman}
                    </div>
                    <div className="metric-footer">Stok cukup dan aman</div>
                  </div>
                </div>

                {/* Alerts */}
                {bahan.filter(b => getStatus(b) !== 'aman').length > 0 && (
                  <div className="alert-container" id="dashboard-alerts">
                    {bahan.map(b => {
                      const st = getStatus(b);
                      const sisa = getSisaHari(b).toFixed(1);
                      if (st === 'kritis') {
                        return (
                          <div key={b.id} className="alert-item alert-kritis">
                            <AlertTriangle className="alert-icon" size={18} />
                            <div>
                              <strong>{b.nama}</strong> — stok kritis! {b.via === 'online' 
                                ? `Harus order online sekarang (kirim ${b.kirim} hari, sisa stok ${sisa} hari)` 
                                : `Beli offline hari ini sebelum habis (sisa stok ${sisa} hari)`
                              }
                            </div>
                          </div>
                        );
                      } else if (st === 'segera') {
                        return (
                          <div key={b.id} className="alert-item alert-segera">
                            <ShoppingBag className="alert-icon" size={18} />
                            <div>
                              <strong>{b.nama}</strong> — {b.via === 'online'
                                ? `Order online sekarang! Kirim ${b.kirim} hari, stok habis ${sisa} hari lagi`
                                : `Beli offline besok/lusa, sisa stok ${sisa} hari`
                              }
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Search and Table */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--color-caramel)' }} />
                      Status Inventaris Bahan
                    </h2>
                    
                    <div style={{ position: 'relative', width: '250px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Cari bahan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                        id="search-bahan"
                      />
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table id="table-inventory">
                      <thead>
                        <tr>
                          <th>Bahan</th>
                          <th>Satuan</th>
                          <th style={{ textAlign: 'right' }}>Stok</th>
                          <th style={{ textAlign: 'right' }}>Pakai / Hari</th>
                          <th style={{ textAlign: 'right' }}>Sisa (Hari)</th>
                          <th>Beli Via</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBahan.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                              Tidak ada bahan baku yang cocok dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredBahan.map(b => {
                            const sisa = getSisaHari(b);
                            const st = getStatus(b);
                            return (
                              <tr key={b.id}>
                                <td style={{ fontWeight: 600 }}>{b.nama}</td>
                                <td>{b.satuan}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                  {b.stok % 1 === 0 ? b.stok : b.stok.toFixed(1)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                  {b.pakai}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  {sisa >= 999 ? '—' : sisa.toFixed(1)}
                                </td>
                                <td>
                                  <span className={`badge ${b.via === 'online' ? 'badge-online' : 'badge-offline'}`}>
                                    {b.via} {b.via === 'online' && `(${b.kirim}h)`}
                                  </span>
                                </td>
                                <td>
                                  {st === 'kritis' && <span className="badge badge-kritis">Bahaya</span>}
                                  {st === 'segera' && <span className="badge badge-segera">Segera Order</span>}
                                  {st === 'aman' && <span className="badge badge-aman">Aman</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'catat' && (
              <motion.div
                key="catat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
              >
                {/* ===== NGADON ONE-CLICK CARD ===== */}
                <div className="ngadon-card" id="ngadon-section">
                  <div className="ngadon-header">
                    <div className="ngadon-header-left">
                      <div className="ngadon-icon">🍫</div>
                      <div>
                        <h2 className="ngadon-title">Konfirmasi Ngadon Hari Ini</h2>
                        <p className="ngadon-subtitle">Sekali klik — semua bahan adonan langsung tercatat otomatis</p>
                      </div>
                    </div>
                    <div className="ngadon-date-wrap">
                      <label htmlFor="input-ngadon-tgl" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', display: 'block' }}>Tanggal Ngadon</label>
                      <input
                        type="date"
                        id="input-ngadon-tgl"
                        value={ngadonTgl}
                        onChange={(e) => setNgadonTgl(e.target.value)}
                        className="ngadon-date-input"
                      />
                    </div>
                  </div>

                  <div className="ngadon-recipe-grid">
                    {NGADON_RECIPE.map((item) => (
                      <div key={item.nama} className="ngadon-ingredient">
                        <span className="ngadon-ingredient-name">{item.nama}</span>
                        <span className="ngadon-ingredient-qty">{item.jumlah} <em>{item.satuan}</em></span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleNgadon}
                    disabled={ngadonLoading || actionLoading}
                    className="ngadon-btn"
                    id="btn-ngadon-confirm"
                  >
                    {ngadonLoading
                      ? <><RefreshCw size={18} className="animate-spin" /> Mencatat...</>
                      : <><CheckCircle size={18} /> Iya, Hari Ini Udah Ngadon!</>}
                  </button>
                </div>

                {/* Ngadon Result Receipt */}
                <AnimatePresence>
                  {ngadonResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="ngadon-result-card"
                      id="ngadon-result"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle size={22} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>Ngadon berhasil dicatat! 🎉</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ngadonResult.results.length} bahan dikurangi dari stok</p>
                          </div>
                        </div>
                        <button onClick={() => setNgadonResult(null)} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕ Tutup</button>
                      </div>
                      <div className="ngadon-receipt-grid">
                        {ngadonResult.results.map(r => (
                          <div key={r.nama} className="ngadon-receipt-item">
                            <span>{r.nama}</span>
                            <strong>−{r.jumlah} {r.satuan}</strong>
                          </div>
                        ))}
                      </div>
                      {ngadonResult.notFound.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-warning-bg)', borderRadius: '10px', fontSize: '0.8rem', color: '#92400e', border: '1px solid var(--color-warning-border)' }}>
                          ⚠️ Bahan tidak ditemukan di database: <strong>{ngadonResult.notFound.join(', ')}</strong>. Pastikan nama bahan sesuai.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual forms below */}
                <div className="split-grid">
                {/* Catat Pemakaian */}
                <div className="card">
                  <h2 className="form-title">
                    <ArrowDownRight size={20} style={{ color: 'var(--color-caramel)' }} />
                    Catat Pemakaian
                  </h2>
                  <form onSubmit={handleCatatPakai} id="form-pakai">
                    <div className="form-group">
                      <label htmlFor="select-pakai-bahan">Bahan Baku</label>
                      <select 
                        id="select-pakai-bahan" 
                        value={pakaiBahanId} 
                        onChange={(e) => setPakaiBahanId(e.target.value)}
                      >
                        {bahan.map(b => (
                          <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="input-pakai-jumlah">Jumlah Dipakai</label>
                      <input 
                        type="number" 
                        id="input-pakai-jumlah"
                        min="0" 
                        step="0.01" 
                        placeholder="Masukkan jumlah..." 
                        value={pakaiJml}
                        onChange={(e) => setPakaiJml(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="input-pakai-tanggal">Tanggal Pemakaian</label>
                      <input 
                        type="date" 
                        id="input-pakai-tanggal"
                        value={pakaiTgl}
                        onChange={(e) => setPakaiTgl(e.target.value)}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '0.75rem' }}
                      disabled={actionLoading}
                      id="submit-pakai"
                    >
                      {actionLoading ? 'Menyimpan...' : 'Simpan Pemakaian'}
                    </button>
                  </form>
                </div>

                {/* Catat Pembelian */}
                <div className="card">
                  <h2 className="form-title">
                    <ArrowUpRight size={20} style={{ color: 'var(--color-success)' }} />
                    Catat Pembelian
                  </h2>
                  <form onSubmit={handleCatatBeli} id="form-beli">
                    <div className="form-group">
                      <label htmlFor="select-beli-bahan">Bahan Baku</label>
                      <select 
                        id="select-beli-bahan" 
                        value={beliBahanId} 
                        onChange={(e) => setBeliBahanId(e.target.value)}
                      >
                        {bahan.map(b => (
                          <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="input-beli-jumlah">Jumlah Dibeli</label>
                      <input 
                        type="number" 
                        id="input-beli-jumlah"
                        min="0" 
                        step="0.01" 
                        placeholder="Masukkan jumlah..." 
                        value={beliJml}
                        onChange={(e) => setBeliJml(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="input-beli-tanggal">Tanggal Pembelian</label>
                      <input 
                        type="date" 
                        id="input-beli-tanggal"
                        value={beliTgl}
                        onChange={(e) => setBeliTgl(e.target.value)}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '0.75rem', background: 'linear-gradient(135deg, var(--color-success), var(--color-seasalt))', boxShadow: '0 4px 15px var(--color-success-border)' }}
                      disabled={actionLoading}
                      id="submit-beli"
                    >
                      {actionLoading ? 'Menyimpan...' : 'Simpan Pembelian'}
                    </button>
                  </form>
                </div>
                </div>{/* end split-grid manual forms */}
              </motion.div>
            )}

            {activeTab === 'kelola' && (
              <motion.div
                key="kelola"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
              >
                {/* Quick Setup Database Banner */}
                <div className="banner-card">
                  <div className="banner-icon">🧁</div>
                  <div className="banner-content" style={{ flex: 1 }}>
                    <h3>Setup Cepat Menu Sweet Salt</h3>
                    <p>Kosongkan data lama dan otomatis seed database dengan 16 daftar bahan baku menu Sweet Salt (dark coklat, oreo, packaging, dll) sesuai pengaturan pengirimannya.</p>
                  </div>
                  <button 
                    onClick={handleResetSeed}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    id="btn-reset-seed"
                    style={{ background: 'linear-gradient(135deg, var(--color-chocolate), var(--color-caramel))' }}
                  >
                    Reset ke Menu Sweet Salt
                  </button>
                </div>

                {/* Form Tambah Bahan */}
                <div className="card">
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} style={{ color: 'var(--color-caramel)' }} />
                    Tambah Bahan Baku Baru
                  </h2>
                  <form onSubmit={handleTambahBahan} id="form-tambah-bahan">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="input-nama-bahan">Nama Bahan</label>
                        <input 
                          type="text" 
                          id="input-nama-bahan" 
                          placeholder="Contoh: Tepung Terigu" 
                          value={newNama}
                          onChange={(e) => setNewNama(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="input-satuan-bahan">Satuan</label>
                        <input 
                          type="text" 
                          id="input-satuan-bahan" 
                          placeholder="Contoh: kg, butir, pcs" 
                          value={newSatuan}
                          onChange={(e) => setNewSatuan(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="input-stok-bahan">Stok Awal</label>
                        <input 
                          type="number" 
                          id="input-stok-bahan" 
                          min="0" 
                          step="0.1" 
                          placeholder="0" 
                          value={newStok}
                          onChange={(e) => setNewStok(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="input-pakai-bahan">Pemakaian / Hari</label>
                        <input 
                          type="number" 
                          id="input-pakai-bahan" 
                          min="0" 
                          step="0.1" 
                          placeholder="0" 
                          value={newPakai}
                          onChange={(e) => setNewPakai(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="select-via-bahan">Metode Pembelian</label>
                        <select 
                          id="select-via-bahan" 
                          value={newVia} 
                          onChange={(e) => setNewVia(e.target.value)}
                        >
                          <option value="offline">Offline (Langsung)</option>
                          <option value="online">Online Store</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="input-kirim-bahan">Est. Pengiriman (Hari, Khusus Online)</label>
                        <input 
                          type="number" 
                          id="input-kirim-bahan" 
                          min="0" 
                          step="1" 
                          disabled={newVia === 'offline'}
                          value={newKirim}
                          onChange={(e) => setNewKirim(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ marginTop: '0.5rem' }}
                      disabled={actionLoading}
                      id="submit-tambah-bahan"
                    >
                      {actionLoading ? 'Menyimpan...' : 'Tambah Bahan'}
                    </button>
                  </form>
                </div>

                {/* List Kelola Bahan */}
                <div className="card">
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    Daftar Bahan Baku Terdaftar
                  </h2>
                  <div className="table-responsive">
                    <table id="table-manage">
                      <thead>
                        <tr>
                          <th>Nama Bahan</th>
                          <th>Satuan</th>
                          <th style={{ textAlign: 'right' }}>Pakai/Hari</th>
                          <th>Beli Via</th>
                          <th>Est. Kirim</th>
                          <th style={{ textAlign: 'right' }}>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bahan.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                              Belum ada bahan baku yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          bahan.map(b => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600 }}>{b.nama}</td>
                              <td>{b.satuan}</td>
                              <td style={{ textAlign: 'right' }}>{b.pakai}</td>
                              <td>
                                <span className={`badge ${b.via === 'online' ? 'badge-online' : 'badge-offline'}`}>
                                  {b.via}
                                </span>
                              </td>
                              <td>{b.via === 'online' ? `${b.kirim} hari` : '—'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  onClick={() => handleHapusBahan(b.id)} 
                                  className="btn btn-danger btn-sm"
                                  disabled={actionLoading}
                                  id={`delete-btn-${b.id}`}
                                >
                                  <Trash2 size={13} />
                                  <span>Hapus</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'log' && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Riwayat Transaksi & Pemakaian
                  </h2>
                  {log.length > 0 && (
                    <button 
                      onClick={handleClearLog} 
                      className="btn btn-sm btn-danger"
                      disabled={actionLoading}
                      id="btn-clear-logs"
                    >
                      Hapus Semua Riwayat
                    </button>
                  )}
                </div>

                <div className="timeline" id="log-list">
                  {log.length === 0 ? (
                    <div className="empty-state">
                      <History size={32} className="empty-icon" />
                      <p>Belum ada aktivitas yang tercatat.</p>
                    </div>
                  ) : (
                    log.map(l => (
                      <div key={l.id} className="timeline-item">
                        <div className="timeline-content">
                          <div className={`timeline-indicator ${l.tipe === 'pakai' ? 'indicator-pakai' : 'indicator-beli'}`}></div>
                          <div className="timeline-info">
                            <span className="timeline-name">{l.nama_bahan}</span>
                            <span className="timeline-detail">
                              {l.tipe === 'pakai' ? 'Dipakai sebanyak ' : 'Dibeli sebanyak '}
                              <strong>{l.jumlah} {l.satuan}</strong>
                            </span>
                          </div>
                        </div>
                        <span className="timeline-date">{l.tanggal}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
