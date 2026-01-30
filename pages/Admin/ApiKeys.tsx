
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DB } from '../../services/db';
import { ApiKey } from '../../types';

const ApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');

  // Fix: Fetch API keys asynchronously in useEffect
  useEffect(() => {
    const fetchKeys = async () => {
      const data = await DB.getApiKeys();
      setKeys(data);
    };
    fetchKeys();
  }, []);

  const handleAddKey = async () => {
    if (!newKey.trim()) return;
    const updated: ApiKey[] = [...keys, { key: newKey.trim(), status: 'ACTIVE' as const, usageCount: 0 }];
    await DB.saveApiKeys(updated);
    setKeys(updated);
    setNewKey('');
    await DB.addLog('INFO', 'Menambahkan API Key baru secara manual.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      const newKeysArray: ApiKey[] = lines.map(k => ({ key: k, status: 'ACTIVE' as const, usageCount: 0 }));
      const updated: ApiKey[] = [...keys, ...newKeysArray];
      await DB.saveApiKeys(updated);
      setKeys(updated);
      await DB.addLog('INFO', `Berhasil upload ${newKeysArray.length} API Keys via file.`);
    };
    reader.readAsText(file);
  };

  const handleDelete = async (index: number) => {
    const updated = keys.filter((_, i) => i !== index);
    await DB.saveApiKeys(updated);
    setKeys(updated);
  };

  const resetStats = async () => {
    const updated = keys.map(k => ({ ...k, usageCount: 0 }));
    await DB.saveApiKeys(updated);
    setKeys(updated);
    await DB.addLog('INFO', 'Statistik API Keys telah direset.');
  };

  return (
    <Layout isAdmin={true}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen API Keys</h1>
          <p className="text-slate-500">Kelola kunci AI Studio/Gemini untuk rotasi otomatis.</p>
        </div>
        <button onClick={resetStats} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200">
          Reset Statistik Penggunaan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">Tambah Kunci Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Input Manual</label>
                <div className="flex space-x-2">
                  <input 
                    type="password" 
                    value={newKey} onChange={e => setNewKey(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    placeholder="AIzaSy..." 
                  />
                  <button onClick={handleAddKey} className="px-4 py-3 orange-gradient text-white rounded-xl font-bold">+</button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Upload Bulk (.txt)</label>
                <div className="relative group">
                  <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:border-orange-300 transition-colors">
                    <span className="text-2xl mb-2">📄</span>
                    <span className="text-sm text-slate-400">Klik untuk upload file kunci</span>
                  </div>
                  <input type="file" onChange={handleFileUpload} accept=".txt" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Daftar API Keys ({keys.length})</h2>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Auto-Rotation Aktif</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">API Key (Hidden)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Usage</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keys.length > 0 ? keys.map((k, i) => (
                    <tr key={i} className="text-sm">
                      <td className="px-6 py-4 font-mono">••••••••{k.key.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${k.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{k.usageCount} requests</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(i)} className="text-red-400 hover:text-red-600">Hapus</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Belum ada API Key yang terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiKeys;
