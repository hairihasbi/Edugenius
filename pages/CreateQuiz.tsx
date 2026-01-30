
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { SUBJECTS_UMUM, SUBJECTS_IPA, SUBJECTS_IPS, SUBJECTS_BAHASA, SUBJECTS_VOKASI } from '../constants.tsx';
import { SMA_Grade, QuizType, Difficulty, CognitiveLevel, QuizJob } from '../types';
import { DB } from '../services/db';
import { GeminiService } from '../services/geminiService';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'UMUM',
    subject: SUBJECTS_UMUM[0],
    grade: SMA_Grade.K10,
    topic: '',
    subTopic: '',
    type: QuizType.PG_4,
    numQuestions: 5,
    difficulty: Difficulty.SEDANG,
    cognitiveLevel: CognitiveLevel.C1,
    language: 'Bahasa Indonesia',
    model: 'gemini-3-flash-preview',
    hasImages: false,
    imageCount: 0,
    summary: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const getSubjectList = () => {
    switch(formData.category) {
      case 'IPA': return SUBJECTS_IPA;
      case 'IPS': return SUBJECTS_IPS;
      case 'BAHASA': return SUBJECTS_BAHASA;
      case 'VOKASI': return SUBJECTS_VOKASI;
      default: return SUBJECTS_UMUM;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newJob: QuizJob = {
      id: Date.now().toString(),
      title: formData.title || `Kuis ${formData.subject} - ${formData.topic}`,
      subject: formData.subject,
      grade: formData.grade,
      topic: formData.topic,
      status: 'PROCESSING',
      progress: 0,
      createdAt: new Date().toISOString(),
      published: false
    };

    await DB.saveJob(newJob);
    await DB.addLog('INFO', `Memulai proses generate: ${newJob.title}`);

    try {
      const results = await GeminiService.generateQuiz({
        subject: formData.subject,
        grade: formData.grade,
        topic: formData.topic,
        numQuestions: formData.numQuestions,
        type: formData.type,
        cognitiveLevel: formData.cognitiveLevel,
        difficulty: formData.difficulty,
        summary: formData.summary,
        language: formData.language,
        modelName: formData.model
      });

      const updatedJob: QuizJob = {
        ...newJob,
        status: 'COMPLETED',
        progress: 100,
        results
      };
      await DB.saveJob(updatedJob);
      await DB.addLog('INFO', `Berhasil generate soal: ${updatedJob.title}`);
      navigate('/history');
    } catch (err: any) {
      const failedJob: QuizJob = {
        ...newJob,
        status: 'FAILED',
        error: err.message
      };
      await DB.saveJob(failedJob);
      await DB.addLog('ERROR', `Gagal generate soal: ${err.message}`);
      alert("Terjadi kesalahan saat generate soal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Buat Soal AI Presisi</h1>
        <p className="text-slate-500">Gunakan kecerdasan buatan untuk merancang soal sesuai standar Kurikulum Merdeka.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm">1</span>
              <span>Identitas & Materi</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Judul Kuis / Nama Paket Soal</label>
                <input 
                  type="text" name="title" value={formData.title} onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" 
                  placeholder="Contoh: Penilaian Harian Biologi Sel" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Kategori Kurikulum</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                    <option value="UMUM">Wajib / Umum</option>
                    <option value="IPA">Peminatan IPA</option>
                    <option value="IPS">Peminatan IPS</option>
                    <option value="BAHASA">Bahasa & Budaya</option>
                    <option value="VOKASI">Vokasi / Kejuruan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Mata Pelajaran</label>
                  <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                    {getSubjectList().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Jenjang & Kelas</label>
                  <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                    <option value={SMA_Grade.K10}>SMA - Kelas 10</option>
                    <option value={SMA_Grade.K11}>SMA - Kelas 11</option>
                    <option value={SMA_Grade.K12}>SMA - Kelas 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Bahasa Pengantar</label>
                  <select name="language" value={formData.language} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                    <option>Bahasa Indonesia</option>
                    <option>Bahasa Inggris</option>
                    <option>Bahasa Arab</option>
                    <option>Bahasa Jerman</option>
                    <option>Bahasa Jepang</option>
                    <option>Bahasa Mandarin</option>
                    <option>Bahasa Perancis</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Topik / Tujuan Pembelajaran Utama</label>
                <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Struktur Atom dan Sistem Periodik" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sub-Materi (Opsional)</label>
                <input type="text" name="subTopic" value={formData.subTopic} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Konfigurasi Elektron" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm">2</span>
              <span>Acuan Konten (Opsional)</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ringkasan Materi (.txt atau Paste Teks)</label>
                <textarea 
                  name="summary" value={formData.summary} onChange={handleInputChange}
                  rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm" 
                  placeholder="Tempelkan ringkasan materi di sini agar soal lebih akurat sesuai buku paket Anda..."
                ></textarea>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Referensi Gambar (Upload)</label>
                  <input type="file" accept=".png,.jpg,.jpeg" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm">3</span>
              <span>Parameter Soal</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model AI</label>
                <select name="model" value={formData.model} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Cepat)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Logika Tinggi)</option>
                  <option value="gemini-2.5-flash-lite-latest">Gemini 2.5 Flash Lite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipe Soal</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm">
                  {Object.values(QuizType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Jumlah Soal</label>
                  <input type="number" name="numQuestions" value={formData.numQuestions} onChange={handleInputChange} min="1" max="50" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Kesulitan</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm">
                    {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Level Kognitif</label>
                <select name="cognitiveLevel" value={formData.cognitiveLevel} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm">
                  {Object.values(CognitiveLevel).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-4 space-y-3 border-t">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="hasImages" checked={formData.hasImages} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" />
                  <span className="text-sm text-slate-700 font-medium">Sertakan Soal Bergambar (AI Visual)</span>
                </label>
                {formData.hasImages && (
                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah Soal Bergambar</label>
                    <input type="number" name="imageCount" value={formData.imageCount} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 orange-gradient text-white font-bold rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center space-x-2 transition-transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sedang Memproses...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Soal Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default CreateQuiz;
