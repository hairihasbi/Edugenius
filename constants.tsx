
export const SUBJECTS_UMUM = [
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Pendidikan Agama Kristen dan Budi Pekerti',
  'Pendidikan Agama Katolik dan Budi Pekerti',
  'Pendidikan Agama Hindu dan Budi Pekerti',
  'Pendidikan Agama Buddha dan Budi Pekerti',
  'Pendidikan Agama Khonghucu dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Bahasa Inggris',
  'Pendidikan Jasmani Olahraga dan Kesehatan',
  'Sejarah',
  'Seni Musik',
  'Seni Rupa',
  'Seni Teater',
  'Seni Tari',
  'Informatika'
];

export const SUBJECTS_IPA = [
  'Biologi',
  'Kimia',
  'Fisika',
  'Matematika Tingkat Lanjut'
];

export const SUBJECTS_IPS = [
  'Ekonomi',
  'Sosiologi',
  'Geografi',
  'Antropologi'
];

export const SUBJECTS_BAHASA = [
  'Bahasa Indonesia Tingkat Lanjut',
  'Bahasa Inggris Tingkat Lanjut',
  'Bahasa Korea',
  'Bahasa Arab',
  'Bahasa Jepang',
  'Bahasa Mandarin',
  'Bahasa Perancis',
  'Bahasa Jerman'
];

export const SUBJECTS_VOKASI = [
  'Dasar-dasar Teknik Konstruksi dan Perumahan',
  'Dasar-dasar Teknik Otomotif',
  'Dasar-dasar Teknik Elektronika',
  'Dasar-dasar Pengembangan Perangkat Lunak dan GIM',
  'Akuntansi dan Keuangan Lembaga',
  'Manajemen Perkantoran dan Layanan Bisnis',
  'Usaha Layanan Wisata',
  'Pemasaran'
];

export const SYSTEM_PROMPT_TEMPLATE = (subject: string, lang: string) => `
You are a senior expert teacher in ${subject} following the "Kurikulum Merdeka" standard in Indonesia.
Language of Output: ${lang}.

STRICT FORMATTING FOR EXACT SCIENCES (MathJax & MS Word Compatible):
1. Use $...$ for inline formulas.
2. Use $$...$$ for display equations.
3. For Chemistry, use \\ce{...} (mhchem), e.g., $\\ce{H2O}$.
4. IMPORTANT: Keep LaTeX syntax clean and standard. Microsoft Word's Equation Editor (Alt+=) often parses standard TeX better if it's simplified.
5. Avoid nested complex environments unless necessary. Use \\frac{a}{b} for fractions, \\sqrt{x} for roots.
6. For multiplication, use \\times or \\cdot.
7. Ensure all scientific notation uses LaTeX, e.g., $6.02 \\times 10^{23}$.

Generate high-precision content that renders perfectly in both web browsers (MathJax) and document editors (Word/PDF).
`;
