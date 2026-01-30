
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { DB } from '../../services/db';
import { QuizJob } from '../../types';

const ContentManagement = () => {
  const [quizzes, setQuizzes] = useState<QuizJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, quiz: QuizJob | null }>({ isOpen: false, quiz: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fix: Await getJobs from DB since it's an async operation
    const rawData = await DB.getJobs();
    const data = rawData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setQuizzes(data);
  };

  const handleTogglePublish = async (quiz: QuizJob) => {
    const updated = { ...quiz, published: !quiz.published };
    await DB.saveJob(updated);
    await DB.addLog('INFO', `Status publikasi konten "${quiz.title}" diubah.`);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus konten ini secara permanen?")) {
      await DB.deleteJob(id);
      await DB.addLog('WARNING', `Konten ID: ${id} telah dihapus dari manajemen konten.`);
      loadData();
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         q.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
                         (filter === 'PUBLISHED' && q.published) || 
                         (filter === 'DRAFT' && !q.published);
    return matchesSearch && matchesFilter;
  });

  const openShare = (quiz: QuizJob) => {
    setShareModal({ isOpen: true, quiz });
  };

  return (
    <Layout isAdmin={true}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Konten</h1>
          <p className="text-slate-500">Publikasikan hasil generate soal ke galeri publik dan bagikan link.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
           {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-orange-600'}`}
             >
               {f === 'ALL' ? 'Semua' : f === 'PUBLISHED' ? 'Publik' : 'Draft'}
             </button>
           ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Konten</p>
            <p className="text-3xl font-bold text-slate-800">{quizzes.length}</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">📚</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dipublikasikan</p>
            <p className="text-3xl font-bold text-green-600">{quizzes.filter(q => q.published).length}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl">🌐</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Draft</p>
            <p className="text-3xl font-bold text-orange-600">{quizzes.filter(q => !q.published).length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-xl">📝</div>
        </div>
      </div>

      {/* Content Search */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm mb-8">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Cari judul soal atau mata pelajaran..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQuizzes.length > 0 ? filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-3xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  quiz.published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {quiz.published ? 'Published' : 'Draft'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(quiz.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors">
                {quiz.title}
              </h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs text-slate-500">
                  <span className="w-20 font-bold text-slate-400 uppercase text-[9px]">Pelajaran:</span>
                  <span className="truncate">{quiz.subject}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <span className="w-20 font-bold text-slate-400 uppercase text-[9px]">Jenjang:</span>
                  <span>{quiz.grade}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-2">
                <Link 
                  to={`/view/${quiz.id}`}
                  className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold text-center hover:bg-slate-900 transition-colors"
                >
                  👁️ Preview
                </Link>
                <button 
                  onClick={() => openShare(quiz)}
                  className="px-3 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-colors"
                  title="Bagikan & QR"
                >
                  🔗
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t flex items-center justify-between">
               <button 
                 onClick={() => handleTogglePublish(quiz)}
                 className={`text-[10px] font-black uppercase tracking-widest ${quiz.published ? 'text-orange-600' : 'text-green-600'}`}
               >
                 {quiz.published ? 'Tarik Publikasi' : 'Publikasikan'}
               </button>
               <button 
                 onClick={() => handleDelete(quiz.id)}
                 className="text-red-400 hover:text-red-600 p-1"
               >
                 🗑️
               </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <span className="text-4xl mb-4">📭</span>
            <p className="text-slate-400 font-medium">Tidak ada konten yang sesuai kriteria.</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && shareModal.quiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Bagikan Soal</h2>
                <p className="text-slate-400 text-sm">Bagikan akses untuk Guru & Siswa.</p>
              </div>
              <button onClick={() => setShareModal({ isOpen: false, quiz: null })} className="text-slate-300 hover:text-slate-800 text-2xl">✕</button>
            </div>

            <div className="flex flex-col items-center mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-sm border mb-4 flex items-center justify-center relative group">
                {/* Mock QR Code */}
                <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 orange-gradient rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-lg">E</div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pindai QR Code</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Link Langsung</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" readOnly 
                    value={`${window.location.origin}/#/view/${shareModal.quiz.id}`}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#/view/${shareModal.quiz!.id}`);
                      alert("Link berhasil disalin!");
                    }}
                    className="px-4 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">Facebook</button>
                <button className="py-3 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold border border-sky-100">Twitter</button>
                <button className="py-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100">WhatsApp</button>
              </div>
            </div>

            <button 
              onClick={() => setShareModal({ isOpen: false, quiz: null })}
              className="w-full mt-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ContentManagement;
