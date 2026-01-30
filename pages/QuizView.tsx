
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Latex from '../components/Latex';
import { DB } from '../services/db';
import { QuizJob, QuizQuestion } from '../types';

const QuizView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<QuizJob | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<QuizJob[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [paperSize, setPaperSize] = useState<'A4' | 'FOLIO'>('A4');
  const [isCopied, setIsCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Fix: Await getJobs from DB since it's an async operation
    const loadData = async () => {
      const session = localStorage.getItem('edugenius_session');
      setIsAuthenticated(!!session);

      const allJobs = await DB.getJobs();
      const foundJob = allJobs.find(j => j.id === id);
      if (foundJob) {
        setJob(foundJob);
        document.title = `${foundJob.title} - EduGenius AI`;
        const related = allJobs
          .filter(j => j.id !== id && j.published && j.subject === foundJob.subject)
          .slice(0, 3);
        setRelatedPosts(related);
      } else {
        navigate('/');
      }
    };
    loadData();
  }, [id, navigate]);

  if (!job) return (
    <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Memuat Post Viewer...</p>
    </div>
  );

  const handlePrint = () => { window.print(); };

  const exportToDocx = (includeAnswers: boolean) => {
    if (!job) return;

    const dimensions = paperSize === 'A4' ? '210mm 297mm' : '215.9mm 330.2mm';
    const filename = `${includeAnswers ? 'KUNCI' : 'SOAL'}_${job.subject.toUpperCase()}_${Date.now()}.doc`;

    const formatMathForWord = (text: string) => {
      return text.replace(/\$(.*?)\$/g, '<span style="font-family:\'Cambria Math\',serif;font-style:italic;">$1</span>');
    };

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page {
            size: ${dimensions};
            margin: 2cm 2.5cm 2cm 2.5cm;
            mso-page-orientation: portrait;
          }
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt; 
            line-height: 1.5;
            color: black;
          }
          .header { text-align: center; margin-bottom: 20pt; border-bottom: 2pt solid black; padding-bottom: 10pt; }
          .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
          .meta { font-size: 10pt; margin-top: 5pt; }
          .question-block { margin-bottom: 15pt; page-break-inside: avoid; }
          .q-text { font-weight: bold; margin-bottom: 5pt; }
          .options-list { margin-left: 20pt; }
          .option-item { margin-bottom: 3pt; }
          .answer-key { 
            margin-top: 10pt; 
            padding: 10pt; 
            background: #f3f4f6; 
            border-left: 3pt solid #ea580c;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${job.title}</div>
          <div class="meta">
            Mata Pelajaran: ${job.subject} | Kelas: ${job.grade} | Topik: ${job.topic}
          </div>
        </div>
        ${job.results?.map((q, idx) => `
          <div class="question-block">
            <table border="0" cellspacing="0" cellpadding="0" style="width:100%">
              <tr>
                <td style="width:25pt; vertical-align:top; font-weight:bold;">${idx + 1}.</td>
                <td style="vertical-align:top;">
                  <div class="q-text">${formatMathForWord(q.question)}</div>
                  ${q.options && q.options.length > 0 ? `
                    <div class="options-list">
                      ${q.options.map((opt, oIdx) => `<div class="option-item"><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${formatMathForWord(opt)}</div>`).join('')}
                    </div>
                  ` : '<div style="height:50pt; border:1pt dashed #ccc; margin-top:10pt;"></div>'}
                </td>
              </tr>
            </table>
          </div>
        `).join('')}
        ${includeAnswers ? `
          <br clear="all" style="page-break-before:always" />
          <div style="font-weight:bold; text-align:center; padding:10px; background:#000; color:#fff;">KUNCI JAWABAN & PEMBAHASAN</div>
          ${job.results?.map((q, idx) => `
            <div class="answer-key">
              <strong>SOAL NO ${idx + 1}</strong><br/>
              <strong>Kunci:</strong> ${formatMathForWord(q.answer)}<br/>
              <strong>Pembahasan:</strong> ${formatMathForWord(q.explanation)}
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    DB.addLog('INFO', `User mendownload Word: ${filename}`);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(job.title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header Action Bar */}
        <div className="mb-10 print:hidden">
          <nav className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            <Link to="/" className="hover:text-orange-500">Beranda</Link>
            <span>/</span>
            <span>Galeri PDF</span>
            <span>/</span>
            <span className="text-slate-800 truncate max-w-[200px]">{job.title}</span>
          </nav>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider rounded-full tracking-widest">Post Viewer AI</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(job.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">
                <Latex content={job.title} />
              </h1>

              <div className="flex items-center space-x-4 mt-6">
                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-2xl border">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kunci Jawaban</span>
                  <button 
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${showAnswers ? 'bg-orange-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAnswers ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${showAnswers ? 'text-orange-600' : 'text-slate-400'}`}>
                    {showAnswers ? 'TAMPIL' : 'SEMBUNYI'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl border">
                  <button onClick={() => setPaperSize('A4')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${paperSize === 'A4' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>A4</button>
                  <button onClick={() => setPaperSize('FOLIO')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${paperSize === 'FOLIO' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>FOLIO</button>
               </div>
               
               <button onClick={handlePrint} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  <span>📥</span> PDF
               </button>

               <div className="relative group">
                  <button className="px-5 py-3 orange-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center gap-2 hover:scale-105 transition-all">
                    <span>📄</span> DOCX
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">Opsi Ekspor Word</p>
                     <button onClick={() => exportToDocx(false)} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest">Dokumen Soal Saja</button>
                     <button onClick={() => exportToDocx(true)} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl text-[10px] font-black text-orange-600 uppercase tracking-widest">Soal + Kunci & Pembahasan</button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Full-Width Content Area */}
        <div className="w-full mb-12">
           <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border border-slate-100 relative min-h-[800px] overflow-hidden">
              {/* Paper Header */}
              <div className="text-center mb-12 border-b-2 border-slate-900 pb-8 flex flex-col items-center">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{job.title}</h2>
                 <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">{job.subject} — {job.grade}</p>
                 <div className="w-full grid grid-cols-2 mt-6 text-left text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    <div>Mata Pelajaran: {job.subject}</div>
                    <div className="text-right">Topik: {job.topic}</div>
                 </div>
              </div>

              {/* Questions */}
              <div className="space-y-12">
                 {job.results?.map((q, idx) => (
                    <div key={q.id} className="break-inside-avoid">
                       <div className="flex items-start space-x-4">
                          <span className="font-black text-slate-900 text-lg mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                             <div className="text-lg font-semibold text-slate-800 mb-6 leading-relaxed">
                                <Latex content={q.question} />
                             </div>
                             {q.options && q.options.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                                   {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-start space-x-3 text-base text-slate-700">
                                         <span className="font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                         <div className="flex-1"><Latex content={opt} /></div>
                                      </div>
                                   ))}
                                </div>
                             ) : (
                                <div className="h-32 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">Area untuk jawaban uraian</div>
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Key Answer & Discussion */}
              {showAnswers && (
                <div className="mt-20 pt-16 border-t-2 border-dashed border-slate-200 print:page-break-before-always">
                  <div className="flex items-center space-x-3 mb-10">
                      <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white text-lg">🔑</div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Kunci Jawaban & Analisis</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-10">
                      {job.results?.map((q, idx) => (
                        <div key={`ans-${q.id}`} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 break-inside-avoid">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">{idx + 1}</span>
                                  <span className="font-black text-slate-800 text-sm">JAWABAN: <Latex content={q.answer} /></span>
                              </div>
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black rounded uppercase tracking-widest">{q.cognitiveLevel}</span>
                            </div>
                            <div className="pl-10 space-y-4">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Indikator: <span className="text-slate-800">{q.indicator}</span></div>
                              <div className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-orange-200 pl-4">
                                  <span className="block font-black text-[9px] text-orange-500 uppercase tracking-widest mb-1">Pembahasan:</span>
                                  <Latex content={q.explanation} />
                                </div>
                            </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Tools & Sharing Section (Moved to Bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden mb-20">
           {/* QR Section */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Pindai & Bagikan QR</h4>
                <div className="w-32 h-32 mx-auto bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 p-4 flex items-center justify-center relative overflow-hidden">
                   <div className="grid grid-cols-6 gap-1 w-full h-full opacity-30">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                      ))}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl">E</div>
                   </div>
                </div>
              </div>
              <p className="mt-6 text-[10px] font-bold text-slate-500 leading-relaxed italic">Buka di perangkat mobile rekan guru untuk kolaborasi.</p>
           </div>

           {/* Social Sharing */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Kanal Sosial Media</h4>
                <div className="grid grid-cols-2 gap-3">
                   <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="py-4 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-blue-100 hover:bg-blue-100 transition-colors">Facebook</a>
                   <a href={`whatsapp://send?text=${shareTitle}%20${shareUrl}`} className="py-4 bg-green-50 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-green-100 hover:bg-green-100 transition-colors">WhatsApp</a>
                   <button onClick={handleCopyLink} className={`col-span-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-orange-600'}`}>
                      {isCopied ? 'BERHASIL DISALIN! ✓' : 'SALIN TAUTAN'}
                   </button>
                </div>
              </div>
           </div>

           {/* Related Content */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Paket Soal Lainnya</h4>
                <div className="space-y-3">
                   {relatedPosts.length > 0 ? relatedPosts.map(post => (
                      <Link key={post.id} to={`/view/${post.id}`} className="block group">
                         <div className="p-4 bg-slate-50 rounded-2xl border border-transparent group-hover:border-orange-200 group-hover:bg-white transition-all">
                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1 block">{post.subject}</span>
                            <h5 className="text-xs font-bold text-slate-800 group-hover:text-orange-600 line-clamp-1"><Latex content={post.title} /></h5>
                         </div>
                      </Link>
                   )) : (
                      <p className="text-[10px] text-slate-400 italic px-2">Tidak ada soal terkait saat ini.</p>
                   )}
                </div>
              </div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          @page { margin: 1cm; size: ${paperSize === 'A4' ? 'A4' : '215.9mm 330.2mm'}; }
          .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          ${!showAnswers ? '.mt-20.pt-16.border-t-2.border-dashed.border-slate-200 { display: none !important; }' : ''}
        }
      `}} />
    </Layout>
  );
};

export default QuizView;
