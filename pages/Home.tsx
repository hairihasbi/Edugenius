
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DB } from '../services/db';
import { QuizJob } from '../types';
import Latex from '../components/Latex';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzes, setQuizzes] = useState<QuizJob[]>([]);
  const itemsPerPage = 6;

  // Fix: Fetch quizzes asynchronously in useEffect
  useEffect(() => {
    const fetchQuizzes = async () => {
      const data = await DB.getJobs();
      setQuizzes(data);
    };
    fetchQuizzes();
  }, []);

  const publicQuizzes = useMemo(() => {
    return quizzes
      .filter(j => j.published)
      .filter(j => 
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        j.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.topic.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quizzes, searchTerm]);

  const totalPages = Math.ceil(publicQuizzes.length / itemsPerPage);
  const paginatedQuizzes = publicQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const waNumber = "6285248485127";
  const waMessage = encodeURIComponent("Halo EduGenius, saya mau coba aplikasinya!");
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-orange-100 selection:text-orange-600">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 orange-gradient rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200 group-hover:rotate-6 transition-transform">E</div>
            <div>
              <span className="block font-black text-slate-800 tracking-tight leading-none">EduGenius</span>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">AI Studio</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#gallery" className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors font-black uppercase tracking-widest">Galeri Soal PDF</a>
            <Link to="/login" className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-20 px-6 overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-100 mb-8">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Post Viewer PDF Terintegrasi 📄</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
            Publikasikan Soal <br />
            <span className="text-transparent bg-clip-text orange-gradient">Dalam Format PDF</span>
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Platform pertama di Indonesia yang mendukung generate soal otomatis Kurikulum Merdeka dengan Post Viewer PDF siap cetak.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#gallery" className="w-full sm:w-auto px-10 py-5 orange-gradient text-white font-black rounded-[2rem] shadow-[0_20px_40px_rgba(234,88,12,0.3)] hover:scale-105 transition-all text-sm uppercase tracking-widest">
              Lihat Galeri PDF
            </a>
          </div>
        </div>
      </header>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 px-6 relative z-10 bg-slate-50 rounded-t-[4rem] border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <nav className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              <Link to="/" className="hover:text-orange-500">Beranda</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800">Katalog Preview PDF</span>
            </nav>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Galeri Soal Publik</h2>
                <p className="text-slate-500 mt-2 font-medium">Klik pada paket soal untuk membuka Post Viewer PDF & Pembahasan.</p>
              </div>
              
              <div className="relative group w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Cari mapel atau topik..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-3xl focus:border-orange-300 focus:outline-none transition-all font-medium text-slate-700 shadow-sm"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedQuizzes.length > 0 ? paginatedQuizzes.map(quiz => (
              <div key={quiz.id} className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 orange-gradient opacity-5 group-hover:opacity-10 transition-opacity"></div>
                   <div className="z-10 bg-white p-6 rounded-xl shadow-xl border border-slate-100 transform -rotate-3 group-hover:rotate-0 transition-transform w-2/3 h-2/3 flex flex-col overflow-hidden">
                      <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
                      <div className="h-2 w-3/4 bg-slate-50 rounded mb-4"></div>
                      <div className="h-1.5 w-full bg-slate-50 rounded mb-1"></div>
                      <div className="h-1.5 w-full bg-slate-50 rounded mb-1"></div>
                      <div className="h-1.5 w-2/3 bg-slate-50 rounded"></div>
                   </div>
                   <div className="absolute bottom-4 right-4 z-20">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black text-slate-800 rounded-full shadow-sm border border-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        PDF Preview
                      </span>
                   </div>
                </div>
                
                <div className="p-8 flex-grow">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black rounded uppercase tracking-wider">
                      {quiz.subject}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight group-hover:text-orange-600 transition-colors">
                    <Latex content={quiz.title} />
                  </h3>
                  
                  <div className="text-slate-500 text-xs mb-8 flex items-center space-x-2">
                    <span className="font-bold">{quiz.grade}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium italic truncate max-w-[150px]"><Latex content={quiz.topic} /></span>
                  </div>

                  <Link 
                    to={`/view/${quiz.id}`} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all text-center text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                  >
                    Buka Post PDF
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="text-6xl mb-6">🏜️</div>
                <h3 className="text-xl font-bold text-slate-400">Belum ada paket soal dipublikasikan</h3>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-20 flex justify-center items-center space-x-3">
              {/* Pagination buttons logic as before */}
              <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2025 EduGenius AI Studio — Hasil Publish PDF Terverifikasi AI.</p>
          <div className="flex space-x-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-800">Sitemap</a>
            <a href="#" className="hover:text-slate-800">Robots.txt</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
