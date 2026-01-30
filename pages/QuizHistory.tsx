
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { DB } from '../services/db';
import { QuizJob } from '../types';

const QuizHistory = () => {
  const [jobs, setJobs] = useState<QuizJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const data = await DB.getJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus riwayat ini secara permanen?")) {
      await DB.deleteJob(id);
      await fetchJobs();
      await DB.addLog('WARNING', `Menghapus paket soal ID: ${id}`);
    }
  };

  const handleTogglePublish = async (job: QuizJob) => {
    const updated = { ...job, published: !job.published };
    // Update local state first for instant feedback
    setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    
    try {
      await DB.saveJob(updated);
      await DB.addLog('INFO', `Publikasi "${job.title}" diatur ke: ${updated.published ? 'PUBLIK' : 'DRAFT'}`);
    } catch (err) {
      console.error(err);
      fetchJobs(); // Revert on error
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Format Tanggal Salah";
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Riwayat & Proses</h1>
        <p className="text-slate-500">Kelola hasil generate dan pantau status pemrosesan AI.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Konten</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Engine</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibuat Pada</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Publikasi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.length > 0 ? jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 truncate max-w-[240px]">{job.title}</span>
                      <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{job.subject}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {job.status === 'PROCESSING' ? (
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[9px] font-black text-orange-600 mb-1">
                          <span className="animate-pulse">PROCESSING...</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-orange-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${job.progress}%` }}></div>
                        </div>
                      </div>
                    ) : job.status === 'COMPLETED' ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-black text-green-600 uppercase">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-[10px] font-black text-red-600 uppercase">Failed</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">{formatDate(job.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleTogglePublish(job)}
                      disabled={job.status !== 'COMPLETED'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${job.status !== 'COMPLETED' ? 'opacity-30 cursor-not-allowed' : ''} ${job.published ? 'bg-orange-600' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${job.published ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {job.status === 'COMPLETED' && (
                        <Link to={`/view/${job.id}`} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors" title="Buka Post PDF">👁️</Link>
                      )}
                      <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    {loading ? (
                       <div className="flex flex-col items-center">
                         <div className="w-8 h-8 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</p>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-4xl mb-4">📭</span>
                        <p className="text-slate-400 font-medium">Belum ada riwayat generate soal.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default QuizHistory;
