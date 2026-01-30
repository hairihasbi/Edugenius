
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DB } from '../../services/db';
import { User } from '../../types';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', name: '', role: 'GURU' as const, password: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fix: Await getUsers from DB since it's an async operation
    const fetchUsers = async () => {
      const data = await DB.getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name || !newUser.password) {
      alert("Semua field termasuk password harus diisi!");
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username.toLowerCase(),
      name: newUser.name,
      role: newUser.role,
      active: true,
      password: newUser.password
    };

    await DB.saveUser(user);
    setUsers(await DB.getUsers());
    setNewUser({ username: '', name: '', role: 'GURU', password: '' });
    setIsModalOpen(false);
    await DB.addLog('INFO', `Menambahkan user baru: ${user.name} (${user.username})`);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      for (const line of lines) {
        // Format: username,fullname,password (password is optional, defaults to 'EduGenius123')
        const [username, name, password] = line.split(',');
        if (username && name) {
          await DB.saveUser({
            id: Math.random().toString(36).substr(2, 9),
            username: username.trim().toLowerCase(),
            name: name.trim(),
            role: 'GURU',
            active: true,
            password: (password || 'EduGenius123').trim()
          });
        }
      }
      
      setUsers(await DB.getUsers());
      await DB.addLog('INFO', `Berhasil upload bulk user. Total user: ${lines.length}`);
    };
    reader.readAsText(file);
  };

  const toggleStatus = async (user: User) => {
    const updated = { ...user, active: !user.active };
    await DB.saveUser(updated);
    setUsers(await DB.getUsers());
  };

  const handleDelete = async (id: string) => {
    if (id === 'admin') {
      alert("User Admin Utama tidak dapat dihapus!");
      return;
    }
    if (confirm("Hapus user ini?")) {
      await DB.deleteUser(id);
      setUsers(await DB.getUsers());
      await DB.addLog('WARNING', `Menghapus user ID: ${id}`);
    }
  };

  return (
    <Layout isAdmin={true}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500">Kelola daftar guru dan administrator sistem.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
            📁 Bulk Upload (.txt)
            <input type="file" accept=".txt" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 orange-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:scale-105 transition-all"
          >
            + Tambah User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">@{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${user.active ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${user.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                      title="Hapus User"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Tambah Guru/Admin Baru</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nama Lengkap Sesuai Dapodik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  placeholder="username_guru"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <input 
                  type="password" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Password untuk login"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                >
                  <option value="GURU">Guru</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 orange-gradient text-white font-bold rounded-xl shadow-lg"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-orange-50 rounded-3xl border border-orange-100">
        <h4 className="font-bold text-orange-800 mb-2">💡 Tips Bulk Upload</h4>
        <p className="text-sm text-orange-700 leading-relaxed">
          Gunakan file .txt dengan format <strong>username,nama_lengkap,password</strong> di setiap barisnya. Contoh:<br/>
          <code className="bg-orange-100 px-2 py-0.5 rounded text-orange-900 font-bold">budi123,Budi Santoso,BudiPass123</code><br/>
          <code className="bg-orange-100 px-2 py-0.5 rounded text-orange-900 font-bold">ani_guru,Ani Wijaya,Rahasia321</code>
        </p>
      </div>
    </Layout>
  );
};

export default UserManagement;
