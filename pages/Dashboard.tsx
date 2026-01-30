
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { DB } from '../services/db';
import { QuizJob, ApiKey, LogEntry } from '../types';

const StatCard: React.FC<{ label: string, value: string | number, icon: string, color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border flex items-center space-x-4">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [jobs, setJobs] = useState<QuizJob[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [j, k, l, u] = await Promise.all([
        DB.getJobs(),
        DB.getApiKeys(),
        DB.getLogs(),
        DB.getUsers()
      ]);
      setJobs(j);
      setKeys(k);
      setLogs(l);
      setUserCount(u.length);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Ringkasan Sistem</h1>
        <p className="text-slate-500">Selamat datang kembali di dashboard EduGenius AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Soal" value={jobs.length} icon="📚" color="bg-orange-100 text-orange-600" />
        <StatCard label="API Keys Aktif" value={keys.filter(k => k.status === 'ACTIVE').length} icon="🔑" color="bg-blue-100 text-blue-600" />
        <StatCard label="Total User" value={userCount} icon="👥" color="bg-purple-100 text-purple-600" />
        <StatCard label="System Logs" value={logs.length} icon="📜" color="bg-slate-100 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Aktivitas Terakhir</h2>
            <div className="space-y-4">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-xl border flex items-center justify-center shadow-sm">✍️</div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{job.subject}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                    job.status === 'COMPLETED' ? 'text-green-600' : job.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-center py-10 text-slate-400 italic">Belum ada aktivitas.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-orange-600 text-white p-6 rounded-3xl shadow-xl shadow-orange-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h2 className="text-lg font-bold mb-4 relative z-10">Mulai Cepat</h2>
            <div className="space-y-2 relative z-10">
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm text-white transition-colors">Buat Paket Soal Baru</button>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm text-white transition-colors">Manajemen API Key</button>
              <button className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold text-sm transition-transform active:scale-95">Lihat Panduan Sistem</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Status API Studio</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Auto-Rotation</span>
                <span className="text-green-600 font-black">AKTIF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">API Health</span>
                <span className="text-green-600 font-black">OPTIMAL</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Model Teratas</p>
                <p className="text-sm font-bold text-slate-700">Gemini 3 Flash (95% usage)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
