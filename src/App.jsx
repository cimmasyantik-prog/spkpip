import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, Calculator, Trophy, LogOut, Plus, Trash2, Edit3, 
  School, ChevronRight, TrendingUp, Award, CheckCircle2, Clock, X, Search, Printer, Download, RefreshCw, Menu
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State untuk menu HP

  // =========================================================================
  // URL WEB APP GOOGLE APPS SCRIPT ANDA
  // =========================================================================
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyC_Bwh11knw9nTWUf90Kft-bfc9DGQySgabcPwxQ34r2ZAC8BEyTO8A-Qkd63ESOiWjw/exec";
  
  // --- STATE DATA UTAMA ---
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  // Default data (digunakan jika API gagal dimuat)
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
  const [syncStatus, setSyncStatus] = useState('offline');

  // --- MODAL STATES ---
  const [modalCriteria, setModalCriteria] = useState({ isOpen: false, data: null });
  const [modalAlt, setModalAlt] = useState({ isOpen: false, data: null });

  // =========================================================================
  // API INTEGRATION (SINKRONISASI KE GOOGLE SHEETS)
  // =========================================================================

  useEffect(() => {
    if (!WEB_APP_URL || !WEB_APP_URL.startsWith('http')) {
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
        setCriteria(defaultCriteria);
        setAlternatives(defaultAlternatives);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const syncToCloud = async (updatedCriteria, updatedAlternatives) => {
    if (!WEB_APP_URL || !WEB_APP_URL.startsWith('http')) return;
    
    setSyncStatus('syncing');
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
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
    syncToCloud(updatedCriteria, alternatives);
  };

  const handleDeleteCriteria = (id) => {
    if(window.confirm('Yakin ingin menghapus kriteria ini?')) {
      const updatedCriteria = criteria.filter(c => c.id !== id);
      setCriteria(updatedCriteria);
      handleDataChange();
      syncToCloud(updatedCriteria, alternatives);
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
    syncToCloud(criteria, updatedAlternatives);
  };

  const handleDeleteAlternatif = (id) => {
    if(window.confirm('Yakin ingin menghapus siswa ini?')) {
      const updatedAlternatives = alternatives.filter(a => a.id !== id);
      setAlternatives(updatedAlternatives);
      handleDataChange();
      syncToCloud(criteria, updatedAlternatives);
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
    if (alternatives.length === 0 || criteria.length === 0) return; 

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
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 print:hidden">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">{action}</div>}
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
      <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold border whitespace-nowrap ${styles[type] || styles.pending}`}>
        {children}
      </span>
    );
  };

  const SyncIndicator = () => {
    if (!WEB_APP_URL || !WEB_APP_URL.startsWith('http')) return null;
    
    if (syncStatus === 'syncing') return <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-amber-500 font-medium"><RefreshCw size={14} className="animate-spin"/> <span className="hidden sm:inline">Menyinkronkan...</span></div>;
    if (syncStatus === 'online') return <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-emerald-500 font-medium"><CheckCircle2 size={14}/> <span className="hidden sm:inline">Cloud Terhubung</span></div>;
    return <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-rose-500 font-medium"><X size={14}/> <span className="hidden sm:inline">Mode Offline</span></div>;
  }

  // --- VIEWS ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 md:w-96 h-64 md:h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 relative z-10 mx-2">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <School size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-2">Sistem Pendukung Keputusan PIP Bergilir<br/>SMPN 1 Pomalaa</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" placeholder="Masukkan username" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm" defaultValue="admin" required/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs md:text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-[10px] md:text-xs text-indigo-600 hover:text-indigo-700 font-medium">Lupa sandi?</a>
              </div>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm" defaultValue="admin" required/>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 mt-2">
              Masuk ke Sistem <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && criteria.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <RefreshCw size={32} className="animate-spin text-indigo-600 mb-4" />
        <p className="text-sm md:text-base text-slate-600 font-medium">Mengambil data dari Google Sheets...</p>
      </div>
    )
  }

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Dashboard" subtitle="Ringkasan data sistem pendukung keputusan PIP SMPN 1 Pomalaa." />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 md:p-3.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} className="md:w-6 md:h-6" /></div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Total Calon Siswa</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-800">{alternatives.length}</p>
            </div>
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 mt-auto">
            <TrendingUp size={14} className="text-emerald-500"/><span className="text-emerald-600 font-medium">Data aktif</span> untuk diproses
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 md:p-3.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} className="md:w-6 md:h-6" /></div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Total Kriteria</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-800">{criteria.length}</p>
            </div>
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 mt-auto">Parameter penilaian aktif</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 md:p-3.5 bg-purple-50 text-purple-600 rounded-xl"><Calculator size={20} className="md:w-6 md:h-6" /></div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Status Proses VIKOR</p>
              <p className="text-base md:text-lg font-bold text-slate-800 mt-1">
                {isCalculated ? (<span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={16}/> Selesai</span>) : (<span className="flex items-center gap-1 text-amber-500"><Clock size={16}/> Belum Dihitung</span>)}
              </p>
            </div>
          </div>
          <div className="text-[10px] md:text-xs text-slate-400 mt-auto">{isCalculated ? "Hasil dapat dilihat di menu Ranking" : "Terdapat data baru/ubah, silakan hitung ulang"}</div>
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
          <button onClick={() => setModalCriteria({ isOpen: true, data: null })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 md:py-2.5 md:px-4 rounded-xl flex items-center gap-2 text-xs md:text-sm shadow-sm transition-all whitespace-nowrap">
            <Plus size={16} /> Tambah Kriteria
          </button>
        }
      />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">ID</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold min-w-[150px]">Nama Kriteria</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center whitespace-nowrap">Bobot</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center whitespace-nowrap">Sifat</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium text-slate-500">{c.id}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 text-center font-semibold">{c.weight}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4 text-center"><Badge type={c.type.toLowerCase()}>{c.type}</Badge></td>
                  <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalCriteria({ isOpen: true, data: c })} className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteCriteria(c.id)} className="p-1.5 md:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm md:text-base text-slate-800">{modalCriteria.data ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}</h3>
              <button onClick={() => setModalCriteria({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveCriteria} className="p-4 md:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">ID Kriteria</label>
                <input type="text" name="id" defaultValue={modalCriteria.data?.id || `C${criteria.length + 1}`} readOnly={!!modalCriteria.data} className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Nama Kriteria</label>
                <input type="text" name="name" defaultValue={modalCriteria.data?.name} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required autoFocus/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Sifat Kriteria</label>
                  <select name="type" defaultValue={modalCriteria.data?.type || 'Benefit'} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    <option value="Benefit">Benefit (Keuntungan)</option>
                    <option value="Cost">Cost (Biaya)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Bobot</label>
                  <input type="number" name="weight" step="0.1" min="0" defaultValue={modalCriteria.data?.weight || 1} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setModalCriteria({ isOpen: false, data: null })} className="px-3 py-2 md:px-4 text-xs md:text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-3 py-2 md:px-4 text-xs md:text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">Simpan</button>
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
        subtitle="Daftar calon penerima bantuan PIP dan nilai matriks."
        action={
          <div className="flex gap-2 md:gap-3">
             <div className="relative">
               <input type="text" placeholder="Cari NISN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-slate-200 rounded-xl pl-8 pr-3 py-2 md:py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white w-32 sm:w-48 md:w-64" />
               <Search size={14} className="absolute left-3 top-2.5 md:top-3 text-slate-400"/>
             </div>
             <button onClick={() => setModalAlt({ isOpen: true, data: null })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 md:py-2.5 md:px-4 rounded-xl flex items-center gap-2 text-xs md:text-sm shadow-sm transition-all whitespace-nowrap">
               <Plus size={16} /> <span className="hidden sm:inline">Tambah Data</span>
             </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold min-w-[150px]">Siswa</th>
                {criteria.map(c => (
                  <th key={c.id} className="px-3 py-3 md:px-6 md:py-4 font-semibold text-center">{c.id}<br/><span className="text-[9px] md:text-[10px] font-normal text-slate-400 normal-case mt-1 block truncate w-12 md:w-16 mx-auto" title={c.name}>{c.name.split(' ')[0]}</span></th>
                ))}
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlternatives.length > 0 ? filteredAlternatives.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 md:px-6 md:py-4">
                    <div className="font-semibold text-xs md:text-sm text-slate-800">{alt.name}</div>
                    <div className="text-[10px] md:text-xs text-slate-500 mt-0.5">NISN: {alt.nisn}</div>
                  </td>
                  {criteria.map(c => (
                     <td key={c.id} className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 text-center font-mono bg-slate-50/30">{alt[c.id.toLowerCase()] || 0}</td>
                  ))}
                  <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalAlt({ isOpen: true, data: alt })} className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteAlternatif(alt.id)} className="p-1.5 md:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={criteria.length + 2} className="text-center py-8 md:py-12 text-slate-400 text-xs md:text-sm">Tidak ada data siswa ditemukan.</td>
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
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm md:text-base text-slate-800">{modalAlt.data ? 'Edit Data Siswa' : 'Tambah Data Siswa Baru'}</h3>
              <button onClick={() => setModalAlt({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAlternatif} className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">NISN</label>
                  <input type="text" name="nisn" defaultValue={modalAlt.data?.nisn} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">Nama Siswa</label>
                  <input type="text" name="name" defaultValue={modalAlt.data?.name} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
              <hr className="my-3 md:my-4 border-slate-100"/>
              <h4 className="text-xs md:text-sm font-bold text-slate-600 mb-2 md:mb-3">Nilai Matriks Kriteria</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {criteria.map(c => (
                  <div key={c.id}>
                    <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1" title={c.name}>{c.id} <span className="text-[10px] md:text-xs text-slate-400 font-normal">({c.name})</span></label>
                    <input type="number" step="any" name={c.id.toLowerCase()} defaultValue={modalAlt.data ? modalAlt.data[c.id.toLowerCase()] : ''} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" required />
                  </div>
                ))}
              </div>
              <div className="pt-4 md:pt-6 flex gap-2 md:gap-3 justify-end mt-2 md:mt-4">
                <button type="button" onClick={() => setModalAlt({ isOpen: false, data: null })} className="px-3 py-2 md:px-4 text-xs md:text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                <button type="submit" className="px-3 py-2 md:px-4 text-xs md:text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderProses = () => (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Proses Perhitungan VIKOR" subtitle="Kalkulasi algoritma VIKOR untuk mendapatkan indeks (Q)." />
      
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm md:text-base text-indigo-900">Mulai Perhitungan</h3>
          <p className="text-xs md:text-sm text-indigo-700/80 mt-1">Mencari nilai ideal (f+), anti-ideal (f-), Utility (S), Regret (R), dan Indeks Kompromi (Q).</p>
        </div>
        <button onClick={calculateVikor} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 md:py-3 px-4 md:px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all whitespace-nowrap text-sm">
          <Calculator size={18} /> Kalkulasi Sekarang
        </button>
      </div>

      <h3 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 md:mb-4">Hasil Kalkulasi Sementara</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center w-12 md:w-16">ID</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold min-w-[120px]">Nama Siswa</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center">Utility (S)</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center">Regret (R)</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center">Indeks (Q)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isCalculated ? (
                vikorResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-500 text-center font-medium">{r.id}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-semibold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 text-center font-mono">{r.S.toFixed(4)}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 text-center font-mono">{r.R.toFixed(4)}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">{r.Q.toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 md:px-6 md:py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Calculator size={28} className="opacity-20 mb-1 md:mb-2 md:w-8 md:h-8"/>
                      <p className="text-xs md:text-sm">Data belum dikalkulasi.</p>
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
            <button onClick={() => setActiveTab('hasil')} className="w-full md:w-auto bg-white border border-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm">
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
          subtitle="Daftar prioritas penerima PIP berdasarkan skor Q terkecil."
        />
        <div className="hidden print:block mb-6 text-center">
            <h2 className="text-lg md:text-xl font-bold uppercase">Laporan Perengkingan PIP</h2>
            <p className="text-xs md:text-sm">Metode VIKOR - SMPN 1 Pomalaa</p>
            <hr className="mt-4 border-slate-300"/>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse print:border">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider print:bg-gray-100">
                  <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center w-16 md:w-24 print:border-b print:border-r">Rank</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-semibold print:border-b print:border-r min-w-[120px]">Nama Siswa</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center print:border-b print:border-r">Nilai (Q)</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center print:border-b min-w-[140px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {sortedResults.length > 0 ? (
                  sortedResults.map((r, idx) => {
                    const isRecommended = idx < 3; 
                    return (
                      <tr key={r.id} className={`${idx === 0 ? 'bg-amber-50/50' : 'hover:bg-slate-50'} transition-colors print:bg-white`}>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-center print:border-r print:border-b">
                          {idx === 0 ? (
                            <div className="inline-flex items-center justify-center gap-1 md:gap-1.5 bg-amber-100 text-amber-700 px-2 md:px-3 py-1 rounded-lg font-bold text-xs md:text-sm print:bg-transparent print:text-black print:p-0">
                              <Trophy size={14} className="print:hidden"/> 1
                            </div>
                          ) : (
                            <span className="font-semibold text-xs md:text-sm text-slate-500 print:text-black">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 print:border-r print:border-b">
                           <div className="font-semibold text-xs md:text-sm text-slate-800 print:text-black">{r.name}</div>
                           <div className="text-[10px] md:text-xs text-slate-500 mt-0.5 print:text-gray-600">NISN: {r.nisn}</div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-center print:border-r print:border-b">
                           <span className={`font-mono font-bold text-xs md:text-sm ${idx === 0 ? 'text-amber-600' : 'text-indigo-600'} print:text-black`}>
                             {r.Q.toFixed(4)}
                           </span>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-center print:border-b">
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
                    <td colSpan="4" className="px-4 py-8 md:px-6 md:py-12 text-center text-slate-400 print:border">
                      <div className="flex flex-col items-center gap-2">
                        <Award size={28} className="opacity-20 mb-1 md:mb-2 md:w-8 md:h-8 print:hidden"/>
                        <p className="text-xs md:text-sm">Belum ada hasil perangkingan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {sortedResults.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 print:hidden">
             <button onClick={printPDF} className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
               <Printer size={16}/> Cetak PDF
             </button>
             <button onClick={exportToCSV} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
               <Download size={16}/> Export Excel
             </button>
          </div>
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={18} className="md:w-5 md:h-5" /> },
    { id: 'kriteria', label: 'Data Kriteria', icon: <FileText size={18} className="md:w-5 md:h-5" /> },
    { id: 'alternatif', label: 'Data Alternatif', icon: <Users size={18} className="md:w-5 md:h-5" /> },
    { id: 'proses', label: 'Proses VIKOR', icon: <Calculator size={18} className="md:w-5 md:h-5" /> },
    { id: 'hasil', label: 'Hasil Ranking', icon: <Award size={18} className="md:w-5 md:h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 print:bg-white print:text-black">
      
      {/* Overlay Background for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR - Responsive */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 md:w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-sm flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <School size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base text-slate-800 leading-tight">SPK PIP</h1>
              <p className="text-[10px] md:text-xs text-slate-500">SMPN 1 Pomalaa</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 p-1" onClick={() => setIsMobileMenuOpen(false)}>
             <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-4 md:py-6 px-3 md:px-4 overflow-y-auto">
          <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 md:mb-4 px-3">Menu Utama</div>
          <ul className="space-y-1 md:space-y-1.5">
            {navItems.map(item => (
              <li key={item.id}>
                <button 
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                  className={`w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-xl flex items-center gap-3 transition-all text-sm ${
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

        <div className="p-3 md:p-4 border-t border-slate-100 m-3 md:m-4">
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium flex items-center justify-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
             <LogOut size={16} className="md:w-[18px] md:h-[18px]" /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible">
        
        {/* TOP HEADER - Responsive */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 md:h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 print:hidden">
           <div className="flex items-center gap-2 md:gap-4">
             <button className="lg:hidden text-slate-600 p-1.5 mr-1 bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={18} />
             </button>
             <div className="text-slate-400 text-xs md:text-sm font-medium hidden sm:block">
               SPK PIP <span className="mx-1 md:mx-2">•</span> VIKOR
             </div>
             <SyncIndicator />
           </div>
           <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-xs md:text-sm font-bold text-slate-800">Admin Utama</div>
               <div className="text-[10px] md:text-xs text-slate-500">Operator Sekolah</div>
             </div>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm md:text-lg border-2 border-white shadow-sm">
               A
             </div>
           </div>
        </header>
        
        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
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
