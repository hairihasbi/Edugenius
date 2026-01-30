
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DB } from '../services/db';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState({ q: '', a: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setChallenge({ q: `${a} + ${b} = ?`, a: a + b });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer) !== challenge.a) {
      setError('Jawaban keamanan salah!');
      generateChallenge();
      return;
    }

    // Fix: Await getUsers from DB since it's an async operation
    const users = await DB.getUsers();
    const inputUsername = username.toLowerCase().trim();

    // Check hardcoded admin for specific prompt requirement
    if (inputUsername === 'hairi' && password === 'Midorima88@@') {
      localStorage.setItem('edugenius_session', JSON.stringify({ username: 'hairi', role: 'ADMIN' }));
      navigate('/dashboard');
      return;
    }

    // Check dynamic users
    const foundUser = users.find(u => u.username === inputUsername);
    if (foundUser && foundUser.active && foundUser.password === password) {
      localStorage.setItem('edugenius_session', JSON.stringify({ username: foundUser.username, role: foundUser.role }));
      navigate('/dashboard');
    } else {
      setError('Username, Password salah, atau akun non-aktif!');
      generateChallenge();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-100 p-8 border border-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 orange-gradient rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-orange-200 mx-auto mb-4">E</div>
          <h2 className="text-2xl font-bold text-slate-800">Login Admin/Guru</h2>
          <p className="text-slate-400">Masuk untuk mengelola generator soal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center space-x-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <label className="block text-sm font-bold text-orange-700 mb-2">Tantangan Keamanan</label>
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
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Mode Uji Coba (Demo Account)</p>
           <div className="flex items-center justify-center space-x-4 text-sm font-bold text-blue-700">
              <div className="flex flex-col">
                 <span className="text-[9px] text-blue-400 font-medium uppercase">User</span>
                 <span>guru123</span>
              </div>
              <div className="w-px h-6 bg-blue-200"></div>
              <div className="flex flex-col">
                 <span className="text-[9px] text-blue-400 font-medium uppercase">Pass</span>
                 <span>guru123</span>
              </div>
           </div>
           <button 
             onClick={() => { setUsername('guru123'); setPassword('guru123'); }}
             className="mt-3 text-[10px] font-bold text-blue-600 hover:underline"
           >
             Klik untuk isi otomatis
           </button>
        </div>

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
