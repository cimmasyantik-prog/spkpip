import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, Calculator, Trophy, LogOut, Plus, Trash2, Edit3, 
  School, ChevronRight, TrendingUp, Award, CheckCircle2, Clock, X, Search, Printer, Download, RefreshCw
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // =========================================================================
  // 🔴 PASTE URL WEB APP GOOGLE APPS SCRIPT ANDA DI BAWAH INI 🔴
  // =========================================================================
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyC_Bwh11knw9nTWUf90Kft-bfc9DGQySgabcPwxQ34r2ZAC8BEyTO8A-Qkd63ESOiWjw/exec";
  
  // --- STATE DATA UTAMA ---
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  // Default data (digunakan jika API belum di-set)
  const defaultCriteria = [
    { id: 'C1', name: 'Penghasilan Orang Tua', type: 'Cost', weight: 2 },
    { id: 'C2', name: 'Rata-rata Nilai Raport', type: 'Benefit', weight: 2 },
    { id: 'C3', name: 'Kedisiplinan', type: 'Benefit', weight: 1 },
    { id: 'C4', name: 'Jumlah Tanggungan', type: 'Benefit', weight: 3 },
    { id: 'C5', name: 'Memiliki Kartu KIP / Riwayat', type: 'Cost', weight: 2 },
  ];

  const defaultAlternatives = [
    { id: 'A1', name: 'Rara', nisn: '00112233', c1: 1, c2: 4, c3: 4, c4: 4, c5: 1 },
    { id: 'A2', name: 'Juanda', nisn: '00112244', c1: 1, c2: 4, c3: 2, c4: 2, c5: 2 },
    { id: 'A3', name: 'Sulfia', nisn: '00112255', c1: 2, c2: 2, c3: 2, c4: 2, c5: 1 },
  ];

  const [vikorResults, setVikorResults] = useState([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline'); // offline, syncing, online

  // --- MODAL STATES ---
  const [modalCriteria, setModalCriteria] = useState({ isOpen: false, data: null });
  const [modalAlt, setModalAlt] = useState({ isOpen: false, data: null });

  // =========================================================================
  // API INTEGRATION (SINKRONISASI KE GOOGLE SHEETS)
  // =========================================================================

  // 1. Ambil data dari Google Sheets saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (WEB_APP_URL === "https://script.google.com/macros/s/AKfycbyC_Bwh11knw9nTWUf90Kft-bfc9DGQySgabcPwxQ34r2ZAC8BEyTO8A-Qkd63ESOiWjw/exec" || !WEB_APP_URL || !WEB_APP_URL.startsWith('http')) {
      setCriteria(defaultCriteria);
      setAlternatives(defaultAlternatives);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setSyncStatus('syncing');
      try {
        const response = await fetch(WEB_APP_URL);
        const res = await response.json();
        
        if (res.status === 'success') {
          if (res.data.criteria && res.data.criteria.length > 0) setCriteria(res.data.criteria);
          if (res.data.alternatives && res.data.alternatives.length > 0) setAlternatives(res.data.alternatives);
          setSyncStatus('online');
        }
      } catch (error) {
        console.error("Gagal mengambil data dari Google Sheets:", error);
        setSyncStatus('offline');
        // Fallback jika gagal/offline
        setCriteria(defaultCriteria);
        setAlternatives(defaultAlternatives);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fungsi untuk mengirim (POST) data perubahan ke Google Sheets
  const syncToCloud = async (updatedCriteria, updatedAlternatives) => {
    if (WEB_APP_URL === "https://script.google.com/macros/s/AKfycbyC_Bwh11knw9nTWUf90Kft-bfc9DGQySgabcPwxQ34r2ZAC8BEyTO8A-Qkd63ESOiWjw/exec" || !WEB_APP_URL || !WEB_APP_URL.startsWith('http')) return;
    
    setSyncStatus('syncing');
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // text/plain hindari masalah CORS Apps Script
        body: JSON.stringify({
          action: "saveAll",
          data: {
            criteria: updatedCriteria,
            alternatives: updatedAlternatives
          }
        })
      });
      setSyncStatus('online');
    } catch (error) {
      console.error("Gagal menyimpan ke Google Sheets:", error);
      setSyncStatus('offline');
    }
  };


  // =========================================================================
  // CRUD HANDLERS
  // =========================================================================

  const handleDataChange = () => {
    setIsCalculated(false);
    setVikorResults([]);
  };

  const handleSaveCriteria = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCrit = {
      id: formData.get('id'),
      name: formData.get('name'),
      type: formData.get('type'),
      weight: parseFloat(formData.get('weight'))
    };

    let updatedCriteria;
    if (modalCriteria.data) {
      updatedCriteria = criteria.map(c => c.id === modalCriteria.data.id ? newCrit : c);
    } else {
      updatedCriteria = [...criteria, newCrit];
    }
    
    setCriteria(updatedCriteria);
    setModalCriteria({ isOpen: false, data: null });
    handleDataChange();
    syncToCloud(updatedCriteria, alternatives); // SINKRONISASI
  };

  const handleDeleteCriteria = (id) => {
    if(window.confirm('Yakin ingin menghapus kriteria ini?')) {
      const updatedCriteria = criteria.filter(c => c.id !== id);
      setCriteria(updatedCriteria);
      handleDataChange();
      syncToCloud(updatedCriteria, alternatives); // SINKRONISASI
    }
  };

  const handleSaveAlternatif = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAlt = {
      id: modalAlt.data ? modalAlt.data.id : `A${Date.now()}`,
      nisn: formData.get('nisn'),
      name: formData.get('name')
    };

    criteria.forEach(c => {
      newAlt[c.id.toLowerCase()] = parseFloat(formData.get(c.id.toLowerCase())) || 0;
    });

    let updatedAlternatives;
    if (modalAlt.data) {
      updatedAlternatives = alternatives.map(a => a.id === modalAlt.data.id ? newAlt : a);
    } else {
      updatedAlternatives = [...alternatives, newAlt];
    }
    
    setAlternatives(updatedAlternatives);
    setModalAlt({ isOpen: false, data: null });
    handleDataChange();
    syncToCloud(criteria, updatedAlternatives); // SINKRONISASI
  };

  const handleDeleteAlternatif = (id) => {
    if(window.confirm('Yakin ingin menghapus siswa ini?')) {
      const updatedAlternatives = alternatives.filter(a => a.id !== id);
      setAlternatives(updatedAlternatives);
      handleDataChange();
      syncToCloud(criteria, updatedAlternatives); // SINKRONISASI
    }
  };

  const filteredAlternatives = alternatives.filter(alt => 
    alt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    alt.nisn.includes(searchQuery)
  );

  // --- EXPORT & PRINT ---
  const exportToCSV = () => {
    if(!isCalculated) return;
    const sortedResults = [...vikorResults].sort((a, b) => a.Q - b.Q);
    const headers = "Peringkat,NISN,Nama Siswa,Nilai S,Nilai R,Nilai Akhir (Q),Status Rekomendasi\n";
    const rows = sortedResults.map((r, idx) => {
      const status = idx < 3 ? 'Direkomendasikan' : 'Menunggu Giliran';
      return `${idx + 1},${r.nisn},${r.name},${r.S.toFixed(4)},${r.R.toFixed(4)},${r.Q.toFixed(4)},${status}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Hasil_SPK_PIP_VIKOR.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printPDF = () => window.print();

  // --- VIKOR CALCULATION ALGORITHM ---
  const calculateVikor = () => {
    if (alternatives.length === 0 || criteria.length === 0) return alert("Data alternatif dan kriteria tidak boleh kosong!");

    const fPlus = {};
    const fMinus = {};

    criteria.forEach(c => {
      const values = alternatives.map(a => a[c.id.toLowerCase()]);
      if (c.type === 'Benefit') {
        fPlus[c.id] = Math.max(...values);
        fMinus[c.id] = Math.min(...values);
      } else {
        fPlus[c.id] = Math.min(...values);
        fMinus[c.id] = Math.max(...values);
      }
    });

    const results = alternatives.map(alt => {
      let S = 0, R = 0;
      criteria.forEach(c => {
        const val = alt[c.id.toLowerCase()];
        const fP = fPlus[c.id];
        const fM = fMinus[c.id];
        const w = c.weight;
        let normalized = 0;
        if (fP !== fM) {
            normalized = (fP - val) / (fP - fM);
        }
        const weightedScore = w * normalized;
        S += weightedScore;
        if (weightedScore > R) { R = weightedScore; }
      });
      return { ...alt, S, R };
    });

    const S_values = results.map(r => r.S);
    const R_values = results.map(r => r.R);
    
    const S_star = Math.min(...S_values);
    const S_min = Math.max(...S_values);
    const R_star = Math.min(...R_values);
    const R_min = Math.max(...R_values);
    
    const v = 0.5;

    results.forEach(r => {
      const termS = S_min !== S_star ? (r.S - S_star) / (S_min - S_star) : 0;
      const termR = R_min !== R_star ? (r.R - R_star) / (R_min - R_star) : 0;
      r.Q = (v * termS) + ((1 - v) * termR);
    });

    setVikorResults(results);
    setIsCalculated(true);
  };

  // --- REUSABLE COMPONENTS ---
  const PageHeader = ({ title, subtitle, action }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );

  const Badge = ({ children, type }) => {
    const styles = {
      benefit: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cost: 'bg-rose-100 text-rose-700 border-rose-200',
      success: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[type] || styles.pending}`}>
        {children}
      </span>
    );
  };

  const SyncIndicator = () => {
    if (WEB_APP_URL === "MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI" || !WEB_APP_URL || !WEB_APP_URL.startsWith('http')) return null;
    
    if (syncStatus === 'syncing') return <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium"><RefreshCw size={14} className="animate-spin"/> Menyinkronkan...</div>;
    if (syncStatus === 'online') return <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium"><CheckCircle2 size={14}/> Cloud Terhubung</div>;
    return <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium"><X size={14}/> Mode Offline</div>;
  }

  // --- VIEWS ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <School size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-sm text-slate-500 mt-2">Sistem Pendukung Keputusan PIP Bergilir<br/>SMPN 1 Pomalaa</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" placeholder="Masukkan username" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm" defaultValue="admin" required/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Lupa sandi?</a>
              </div>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm" defaultValue="admin" required/>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200">
              Masuk ke Sistem <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Jika sedang memuat data dari Cloud pertama kali
  if (isLoading && criteria.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600 font-medium">Mengambil data dari Google Sheets...</p>
      </div>
    )
  }

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Dashboard" subtitle="Ringkasan data sistem pendukung keputusan PIP SMPN 1 Pomalaa." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Calon Siswa</p>
              <p className="text-3xl font-bold text-slate-800">{alternatives.length}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-auto">
            <TrendingUp size={14} className="text-emerald-500"/><span className="text-emerald-600 font-medium">Data aktif</span> untuk diproses
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Kriteria</p>
              <p className="text-3xl font-bold text-slate-800">{criteria.length}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-auto">Parameter penilaian aktif</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl"><Calculator size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Status Proses VIKOR</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {isCalculated ? (<span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={18}/> Selesai</span>) : (<span className="flex items-center gap-1 text-amber-500"><Clock size={18}/> Belum Dihitung</span>)}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-auto">{isCalculated ? "Hasil dapat dilihat di menu Ranking" : "Terdapat data baru/ubah, silakan hitung ulang"}</div>
        </div>
      </div>
    </div>
  );

  const renderKriteria = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Kelola Data Kriteria" 
        subtitle="Daftar parameter yang digunakan untuk penyeleksian PIP."
        action={
          <button onClick={() => setModalCriteria({ isOpen: true, data: null })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-all">
            <Plus size={18} /> Tambah Kriteria
          </button>
        }
      />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Nama Kriteria</th>
                <th className="px-6 py-4 font-semibold text-center">Bobot</th>
                <th className="px-6 py-4 font-semibold text-center">Sifat</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{c.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-center font-semibold">{c.weight}</td>
                  <td className="px-6 py-4 text-center"><Badge type={c.type.toLowerCase()}>{c.type}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalCriteria({ isOpen: true, data: c })} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteCriteria(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KRITERIA */}
      {modalCriteria.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{modalCriteria.data ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}</h3>
              <button onClick={() => setModalCriteria({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveCriteria} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Kriteria</label>
                <input type="text" name="id" defaultValue={modalCriteria.data?.id || `C${criteria.length + 1}`} readOnly={!!modalCriteria.data} className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kriteria</label>
                <input type="text" name="name" defaultValue={modalCriteria.data?.name} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sifat Kriteria</label>
                  <select name="type" defaultValue={modalCriteria.data?.type || 'Benefit'} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    <option value="Benefit">Benefit (Keuntungan)</option>
                    <option value="Cost">Cost (Biaya)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bobot</label>
                  <input type="number" name="weight" step="0.1" min="0" defaultValue={modalCriteria.data?.weight || 1} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setModalCriteria({ isOpen: false, data: null })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlternatif = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Data Alternatif Siswa" 
        subtitle="Daftar calon penerima bantuan PIP dan nilai matriks awal."
        action={
          <div className="flex gap-3">
             <div className="relative">
               <input type="text" placeholder="Cari siswa atau NISN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white w-64" />
               <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
             </div>
             <button onClick={() => setModalAlt({ isOpen: true, data: null })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-all whitespace-nowrap">
               <Plus size={18} /> Tambah Data
             </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Siswa</th>
                {criteria.map(c => (
                  <th key={c.id} className="px-6 py-4 font-semibold text-center">{c.id}<br/><span className="text-[10px] font-normal text-slate-400 normal-case mt-1 block truncate w-16 mx-auto" title={c.name}>{c.name.split(' ')[0]}</span></th>
                ))}
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlternatives.length > 0 ? filteredAlternatives.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{alt.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">NISN: {alt.nisn}</div>
                  </td>
                  {criteria.map(c => (
                     <td key={c.id} className="px-6 py-4 text-sm text-slate-600 text-center font-mono bg-slate-50/30">{alt[c.id.toLowerCase()] || 0}</td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalAlt({ isOpen: true, data: alt })} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteAlternatif(alt.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={criteria.length + 2} className="text-center py-12 text-slate-400 text-sm">Tidak ada data siswa ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ALTERNATIF */}
      {modalAlt.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{modalAlt.data ? 'Edit Data Siswa' : 'Tambah Data Siswa Baru'}</h3>
              <button onClick={() => setModalAlt({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAlternatif} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NISN</label>
                  <input type="text" name="nisn" defaultValue={modalAlt.data?.nisn} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Siswa</label>
                  <input type="text" name="name" defaultValue={modalAlt.data?.name} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
              <hr className="my-4 border-slate-100"/>
              <h4 className="text-sm font-bold text-slate-600 mb-3">Nilai Matriks Kriteria</h4>
              <div className="grid grid-cols-2 gap-4">
                {criteria.map(c => (
                  <div key={c.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1" title={c.name}>{c.id} <span className="text-xs text-slate-400 font-normal">({c.name})</span></label>
                    <input type="number" step="any" name={c.id.toLowerCase()} defaultValue={modalAlt.data ? modalAlt.data[c.id.toLowerCase()] : ''} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" required />
                  </div>
                ))}
              </div>
              <div className="pt-6 flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setModalAlt({ isOpen: false, data: null })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderProses = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Proses Perhitungan VIKOR" subtitle="Jalankan algoritma VIKOR untuk mendapatkan indeks kompromi (Q) dari setiap alternatif." />
      
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-indigo-900">Mulai Perhitungan</h3>
          <p className="text-sm text-indigo-700/80 mt-1">Sistem akan otomatis mencari nilai ideal (f+), anti-ideal (f-), Utility (S), Regret (R), dan Indeks Kompromi (Q).</p>
        </div>
        <button onClick={calculateVikor} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all whitespace-nowrap">
          <Calculator size={18} /> Kalkulasi Sekarang
        </button>
      </div>

      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Hasil Kalkulasi Sementara</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold text-center w-16">ID</th>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold text-center">Utility (S)</th>
                <th className="px-6 py-4 font-semibold text-center">Regret (R)</th>
                <th className="px-6 py-4 font-semibold text-center">Indeks (Q)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isCalculated ? (
                vikorResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 text-center font-medium">{r.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{r.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-mono">{r.S.toFixed(4)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-mono">{r.R.toFixed(4)}</td>
                    <td className="px-6 py-4 text-sm text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">{r.Q.toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Calculator size={32} className="opacity-20 mb-2"/>
                      <p>Data belum dikalkulasi. Silakan tekan tombol kalkulasi di atas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isCalculated && (
        <div className="flex justify-end gap-3">
            <button onClick={() => setActiveTab('hasil')} className="bg-white border border-slate-200 text-slate-700 font-medium py-2 px-5 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              Lihat Ranking
            </button>
        </div>
      )}
    </div>
  );

  const renderHasil = () => {
    const sortedResults = [...vikorResults].sort((a, b) => a.Q - b.Q);

    return (
      <div className="animate-in fade-in duration-500 print:m-0 print:p-0">
        <PageHeader 
          title="Hasil Perengkingan PIP" 
          subtitle="Daftar prioritas penerima PIP berdasarkan skor Q terkecil (Terbaik)."
        />
        <div className="hidden print:block mb-6 text-center">
            <h2 className="text-xl font-bold uppercase">Laporan Perengkingan PIP</h2>
            <p className="text-sm">Metode VIKOR - SMPN 1 Pomalaa</p>
            <hr className="mt-4 border-slate-300"/>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse print:border">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider print:bg-gray-100">
                  <th className="px-6 py-4 font-semibold text-center w-24 print:border-b print:border-r">Peringkat</th>
                  <th className="px-6 py-4 font-semibold print:border-b print:border-r">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold text-center print:border-b print:border-r">Nilai Akhir (Q)</th>
                  <th className="px-6 py-4 font-semibold text-center print:border-b">Status Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {sortedResults.length > 0 ? (
                  sortedResults.map((r, idx) => {
                    const isRecommended = idx < 3; 
                    return (
                      <tr key={r.id} className={`${idx === 0 ? 'bg-amber-50/50' : 'hover:bg-slate-50'} transition-colors print:bg-white`}>
                        <td className="px-6 py-4 text-center print:border-r print:border-b">
                          {idx === 0 ? (
                            <div className="inline-flex items-center justify-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-bold text-sm print:bg-transparent print:text-black print:p-0">
                              <Trophy size={14} className="print:hidden"/> 1
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-500 print:text-black">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 print:border-r print:border-b">
                           <div className="font-semibold text-slate-800 print:text-black">{r.name}</div>
                           <div className="text-xs text-slate-500 mt-0.5 print:text-gray-600">NISN: {r.nisn}</div>
                        </td>
                        <td className="px-6 py-4 text-center print:border-r print:border-b">
                           <span className={`font-mono font-bold ${idx === 0 ? 'text-amber-600' : 'text-indigo-600'} print:text-black`}>
                             {r.Q.toFixed(4)}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center print:border-b">
                          {isRecommended ? (
                            <Badge type="success">Direkomendasikan</Badge>
                          ) : (
                            <Badge type="pending">Menunggu Giliran</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 print:border">
                      <div className="flex flex-col items-center gap-2">
                        <Award size={32} className="opacity-20 mb-2 print:hidden"/>
                        <p>Belum ada hasil perangkingan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {sortedResults.length > 0 && (
          <div className="flex justify-end gap-3 print:hidden">
             <button onClick={printPDF} className="bg-white border border-slate-200 text-slate-700 font-medium py-2 px-5 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
               <Printer size={16}/> Cetak PDF / Print
             </button>
             <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2">
               <Download size={16}/> Export CSV (Excel)
             </button>
          </div>
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={20} /> },
    { id: 'kriteria', label: 'Data Kriteria', icon: <FileText size={20} /> },
    { id: 'alternatif', label: 'Data Alternatif', icon: <Users size={20} /> },
    { id: 'proses', label: 'Proses VIKOR', icon: <Calculator size={20} /> },
    { id: 'hasil', label: 'Hasil Ranking', icon: <Award size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 print:bg-white print:text-black">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col z-20 print:hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <School size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">SPK PIP</h1>
            <p className="text-xs text-slate-500">SMPN 1 Pomalaa</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Menu Utama</div>
          <ul className="space-y-1.5">
            {navItems.map(item => (
              <li key={item.id}>
                <button 
                  onClick={() => setActiveTab(item.id)} 
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === item.id 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={`${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-100 m-4">
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
             <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible">
        {/* TOP HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
           <div className="flex items-center gap-4">
             <div className="text-slate-400 text-sm font-medium">
               Sistem Pendukung Keputusan <span className="mx-2">•</span> Metode VIKOR
             </div>
             <SyncIndicator />
           </div>
           <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-bold text-slate-800">Admin Utama</div>
               <div className="text-xs text-slate-500">Operator Sekolah</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
               A
             </div>
           </div>
        </header>
        
        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'kriteria' && renderKriteria()}
            {activeTab === 'alternatif' && renderAlternatif()}
            {activeTab === 'proses' && renderProses()}
            {activeTab === 'hasil' && renderHasil()}
          </div>
        </main>
      </div>
    </div>
  );
}
