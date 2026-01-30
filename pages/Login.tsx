
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DB } from '../services/db';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState({ q: '', a: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [cloudConfig, setCloudConfig] = useState({ url: '', token: '' });
  const [dbStatus, setDbStatus] = useState<'TURSO' | 'LOCAL'>('LOCAL');
  const navigate = useNavigate();

  useEffect(() => {
    generateChallenge();
    setDbStatus(DB.getConnectionType());
    const saved = localStorage.getItem('edugenius_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCloudConfig({ url: parsed.tursoUrl || '', token: parsed.tursoToken || '' });
    }
  }, []);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setChallenge({ q: `${a} + ${b} = ?`, a: a + b });
  };

  const handleConnectCloud = async () => {
    const settings = await DB.getSettings();
    const updated = { ...settings, tursoUrl: cloudConfig.url, tursoToken: cloudConfig.token };
    await DB.saveSettings(updated);
    
    const test = await DB.testConnection(cloudConfig.url, cloudConfig.token);
    if (test.success) {
      alert("Database Cloud Terhubung! Sekarang Anda bisa login menggunakan akun yang ada di server.");
      window.location.reload();
    } else {
      setError("Gagal terhubung: " + test.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer) !== challenge.a) {
      setError('Jawaban keamanan salah!');
      generateChallenge();
      return;
    }

    const users = await DB.getUsers();
    const inputUsername = username.toLowerCase().trim();

    // Akun Master tetap bisa masuk walau offline/online
    if (inputUsername === 'hairi' && password === 'Midorima88@@') {
      localStorage.setItem('edugenius_session', JSON.stringify({ username: 'hairi', role: 'ADMIN' }));
      navigate('/dashboard');
      return;
    }

    const foundUser = users.find(u => u.username === inputUsername);
    if (foundUser && foundUser.active && foundUser.password === password) {
      localStorage.setItem('edugenius_session', JSON.stringify({ username: foundUser.username, role: foundUser.role }));
      navigate('/dashboard');
    } else {
      setError('Username, Password salah, atau database belum sinkron!');
      generateChallenge();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-100 p-8 border border-white relative overflow-hidden">
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 transition-colors ${dbStatus === 'TURSO' ? 'bg-green-400' : 'bg-orange-400'}`}></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 orange-gradient rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-orange-200 mx-auto mb-4">E</div>
          <h2 className="text-2xl font-bold text-slate-800">Login EduGenius</h2>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'TURSO' ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {dbStatus === 'TURSO' ? 'Cloud Server Active' : 'Offline Local Mode'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center space-x-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {showCloudConfig ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
              <h3 className="text-xs font-black text-blue-700 uppercase mb-1">Pindah Perangkat?</h3>
              <p className="text-[10px] text-blue-600">Masukkan URL & Token Turso Anda untuk menarik data dari Cloud.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Turso DB URL</label>
              <input 
                type="text" value={cloudConfig.url} onChange={e => setCloudConfig({...cloudConfig, url: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                placeholder="libsql://..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Auth Token</label>
              <input 
                type="password" value={cloudConfig.token} onChange={e => setCloudConfig({...cloudConfig, token: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                placeholder="eyJhbG..."
              />
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowCloudConfig(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs">Kembali</button>
              <button onClick={handleConnectCloud} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-100">Hubungkan Cloud</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-mono font-bold text-orange-600">{challenge.q}</span>
                <input 
                  type="number" 
                  className="flex-1 px-4 py-2 bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Hasil..."
                  required
                />
              </div>
            </div>

            <button className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors">
              Masuk Sekarang
            </button>
            
            <button 
              type="button"
              onClick={() => setShowCloudConfig(true)}
              className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
            >
              ☁️ Hubungkan Database Cloud
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link to="/" className="text-sm text-slate-400 hover:text-orange-600 transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
