
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DB } from '../../services/db';
import { SiteSettings as ISiteSettings } from '../../types';

const SiteSettings = () => {
  const [settings, setSettings] = useState<ISiteSettings>({
    siteName: 'EduGenius AI',
    seoDescription: 'Pembuat soal otomatis terbaik di Indonesia.',
    timezone: 'Asia/Jakarta',
    isMaintenance: false,
    autoRotation: true,
    aiFactChecker: true,
    tasksPerHour: 10,
    delayBetweenTasks: 60,
    tursoUrl: '',
    tursoToken: ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await DB.getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Reset test status when inputs change
    if (name === 'tursoUrl' || name === 'tursoToken') {
      setTestStatus({ status: 'idle', message: '' });
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ status: 'testing', message: 'Mencoba menghubungkan...' });
    const result = await DB.testConnection(settings.tursoUrl || '', settings.tursoToken || '');
    setTestStatus({ 
      status: result.success ? 'success' : 'error', 
      message: result.message 
    });
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await DB.saveSettings(settings);
    await DB.addLog('INFO', 'Pengaturan situs & Database telah diperbarui.');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        window.location.reload(); // Reload to re-init DB client
      }, 1500);
    }, 500);
  };

  return (
    <Layout isAdmin={true}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pengaturan Situs</h1>
          <p className="text-slate-500">Kelola identitas, SEO, dan database Cloud SQLite.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`px-6 py-3 orange-gradient text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${saveStatus === 'saving' ? 'opacity-50' : ''}`}
        >
          {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'success' ? '✓ Tersimpan' : 'Simpan & Sinkronisasi'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Database Config */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-200 bg-orange-50/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-orange-800 flex items-center space-x-2">
                <span className="text-xl">☁️</span>
                <span>Cloud Database (Turso SQLite)</span>
              </h2>
              <button 
                onClick={handleTestConnection}
                disabled={testStatus.status === 'testing'}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  testStatus.status === 'testing' ? 'bg-slate-200 text-slate-400' : 
                  testStatus.status === 'success' ? 'bg-green-100 text-green-700' :
                  testStatus.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                {testStatus.status === 'testing' ? '⌛ Testing...' : 'Test Connection'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Turso DB URL</label>
                <input 
                  type="text" name="tursoUrl" value={settings.tursoUrl} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                  placeholder="libsql://your-db-name.turso.io"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Turso Auth Token</label>
                <input 
                  type="password" name="tursoToken" value={settings.tursoToken} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>
              
              {testStatus.message && (
                <div className={`p-3 rounded-xl text-xs font-bold ${testStatus.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {testStatus.status === 'success' ? '✅' : '❌'} {testStatus.message}
                </div>
              )}
              
              <p className="text-[10px] text-orange-500 italic">
                Kosongkan untuk tetap menggunakan Local Storage (Offline Mode). Data akan otomatis disinkronkan ke Cloud setelah kredensial disimpan.
              </p>
            </div>
          </div>

          {/* Identity & SEO */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="text-xl">🏢</span>
              <span>Identitas & SEO</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nama Situs</label>
                <input 
                  type="text" name="siteName" value={settings.siteName} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SEO Deskripsi</label>
                <textarea 
                  name="seoDescription" value={settings.seoDescription} onChange={handleChange}
                  rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Features */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <span>Kecerdasan Buatan</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">AI Fact Checker</h4>
                  <p className="text-[10px] text-slate-500">Verifikasi otomatis setelah soal dibuat.</p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, aiFactChecker: !s.aiFactChecker}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.aiFactChecker ? 'bg-orange-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.aiFactChecker ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Auto-Rotation API</h4>
                  <p className="text-[10px] text-slate-500">Gunakan beberapa API Key bergantian.</p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, autoRotation: !s.autoRotation}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoRotation ? 'bg-orange-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoRotation ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="text-xl">🌐</span>
              <span>Advanced Config</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Robots.txt</label>
                <textarea 
                  name="robotsTxt" value={settings.robotsTxt || ""} onChange={handleChange}
                  rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sitemap.xml</label>
                <textarea 
                  name="sitemapXml" value={settings.sitemapXml || ""} onChange={handleChange}
                  rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SiteSettings;
