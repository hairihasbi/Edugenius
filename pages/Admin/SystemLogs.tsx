
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DB } from '../../services/db';
import { LogEntry } from '../../types';

const SystemLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fix: Await getLogs from DB since it's an async operation
    const fetchLogs = async () => {
      const data = await DB.getLogs();
      setLogs(data);
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua log sistem secara permanen?")) {
      await DB.clearLogs();
      setLogs([]);
      await DB.addLog('WARNING', 'Seluruh log sistem telah dibersihkan oleh Administrator.');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'ERROR': return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-100',
        dot: 'bg-red-500',
        icon: '🚫'
      };
      case 'WARNING': return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-100',
        dot: 'bg-amber-500',
        icon: '⚠️'
      };
      case 'INFO': return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
        dot: 'bg-blue-500',
        icon: 'ℹ️'
      };
      default: return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-100',
        dot: 'bg-slate-500',
        icon: '📄'
      };
    }
  };

  const errorCount = logs.filter(l => l.level === 'ERROR').length;
  const warningCount = logs.filter(l => l.level === 'WARNING').length;

  return (
    <Layout isAdmin={true}>
      <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Terminal</h1>
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full border border-green-200">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitoring</span>
            </div>
          </div>
          <p className="text-slate-500 font-medium">Jejak aktivitas mesin generate AI dan sinkronisasi database.</p>
        </div>
        
        <div className="flex items-center space-x-4">
           <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('INFO')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'INFO' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Info
              </button>
              <button 
                onClick={() => setFilter('ERROR')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ERROR' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Errors
              </button>
           </div>
           <button 
             onClick={handleClearLogs}
             className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors border border-red-100"
           >
             Flush Logs
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📝</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Logs</p>
               <p className="text-2xl font-black text-slate-900">{logs.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${errorCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
               {errorCount > 0 ? '🚫' : '✅'}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Errors</p>
               <p className={`text-2xl font-black ${errorCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{errorCount}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner text-amber-600">⚠️</div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warnings</p>
               <p className="text-2xl font-black text-slate-900">{warningCount}</p>
            </div>
         </div>
      </div>

      {/* Search & Main Log View */}
      <div className="space-y-6">
         <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input 
               type="text"
               placeholder="Filter aktivitas berdasarkan pesan..."
               className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         <div className="space-y-4">
            {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => {
               const styles = getLevelStyles(log.level);
               return (
                  <div key={log.id} className="group flex items-start space-x-6 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                     <div className="flex flex-col items-center flex-shrink-0 mt-2">
                        <div className={`w-3 h-3 rounded-full ${styles.dot} shadow-[0_0_10px_rgba(0,0,0,0.1)] group-hover:scale-150 transition-transform`}></div>
                        <div className="w-px h-full bg-slate-200 mt-2 min-h-[40px] group-last:hidden"></div>
                     </div>
                     <div className={`flex-1 bg-white p-6 rounded-3xl border ${styles.border} group-hover:shadow-xl transition-all group-hover:-translate-y-1`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                           <div className="flex items-center space-x-3">
                              <span className="text-lg">{styles.icon}</span>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${styles.text}`}>
                                 {log.level}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                                 {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                              </span>
                           </div>
                           <div className="text-[10px] font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full uppercase">
                              PID: {log.id.slice(-6)}
                           </div>
                        </div>
                        <p className={`text-sm font-medium ${log.level === 'ERROR' ? 'text-red-900 font-mono bg-red-50/50 p-3 rounded-xl' : 'text-slate-700'}`}>
                           {log.message}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                           <span>Date: {new Date(log.timestamp).toLocaleDateString('id-ID')}</span>
                           <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">Aksi Verifikasi AI &bull; Database Log</span>
                        </div>
                     </div>
                  </div>
               );
            }) : (
               <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-300 shadow-inner">
                  <div className="text-6xl mb-6 grayscale opacity-50">📡</div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Terminal Kosong</h3>
                  <p className="text-slate-400 text-sm mt-2">Belum ada transmisi data sistem yang tercatat.</p>
               </div>
            )}
         </div>
      </div>

      <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 blur-[100px] opacity-20 -mr-32 -mt-32 rounded-full"></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
               <h4 className="text-2xl font-black mb-4">Sistem Audit Forensik</h4>
               <p className="text-slate-400 text-sm leading-relaxed mb-6">EduGenius menggunakan logging berkelanjutan untuk memastikan integritas data. Setiap interaksi API AI Studio dipantau untuk menjaga kualitas output Kurikulum Merdeka dan mencegah kegagalan generate yang berulang.</p>
               <div className="flex items-center space-x-6">
                  <div className="flex flex-col">
                     <span className="text-orange-500 font-black text-xl tracking-tighter">99.9%</span>
                     <span className="text-[9px] uppercase font-bold text-slate-500">Uptime System</span>
                  </div>
                  <div className="w-px h-10 bg-slate-800"></div>
                  <div className="flex flex-col">
                     <span className="text-orange-500 font-black text-xl tracking-tighter">API-V3</span>
                     <span className="text-[9px] uppercase font-bold text-slate-500">Gemini Native</span>
                  </div>
               </div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
               <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Integritas Log</h5>
               <ul className="space-y-3 text-[11px] font-medium text-slate-300">
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✔</span>
                     <span>Sinkronisasi otomatis dengan Database Lokal SQLite.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✔</span>
                     <span>Monitoring rotasi API Key Gemini 2.5/3.0.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✔</span>
                     <span>Proteksi data log dari manipulasi user non-admin.</span>
                  </li>
               </ul>
            </div>
         </div>
      </div>
    </Layout>
  );
};

export default SystemLogs;
