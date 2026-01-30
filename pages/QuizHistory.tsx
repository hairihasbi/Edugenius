
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { DB } from '../services/db';
import { QuizJob } from '../types';

const QuizHistory = () => {
  const [jobs, setJobs] = useState<QuizJob[]>([]);

  useEffect(() => {
    // Fix: Await getJobs from DB since it's an async operation
    const fetchJobs = async () => {
      const data = await DB.getJobs();
      setJobs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    
    fetchJobs();
    
    const interval = setInterval(fetchJobs, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus riwayat ini?")) {
      await DB.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      await DB.addLog('INFO', `Menghapus riwayat soal ID: ${id}`);
    }
  };

  const handleTogglePublish = async (job: QuizJob) => {
    const updated = { ...job, published: !job.published };
    await DB.saveJob(updated);
    setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    await DB.addLog('INFO', `Status publikasi ${job.title} diubah menjadi: ${updated.published}`);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Riwayat & Proses Generate</h1>
        <p className="text-slate-500">Pantau proses pembuatan soal AI secara real-time.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Materi & Pelajaran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu Pembuatan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Publikasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.length > 0 ? jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{job.title}</span>
                      <span className="text-[10px] text-orange-500 font-bold uppercase">{job.subject} • {job.grade}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {job.status === 'PROCESSING' ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-orange-600 mb-1">
                          <span>Memproses...</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-orange-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                        </div>
                      </div>
                    ) : job.status === 'COMPLETED' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Selesai</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">Gagal</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleTogglePublish(job)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${job.published ? 'bg-orange-500' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${job.published ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {job.status === 'COMPLETED' && (
                        <Link to={`/view/${job.id}`} className="text-blue-500 hover:text-blue-700 text-xl" title="Lihat/Preview">👁️</Link>
                      )}
                      {job.status === 'FAILED' && (
                        <button className="text-orange-500 hover:text-orange-700 text-xl" title="Coba Lagi">🔄</button>
                      )}
                      <button onClick={() => handleDelete(job.id)} className="text-red-400 hover:text-red-600 text-xl" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">Belum ada riwayat pembuatan soal.</td>
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
