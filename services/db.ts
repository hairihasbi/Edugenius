
import { createClient } from "@libsql/client";
import { QuizJob, ApiKey, SiteSettings, LogEntry, User } from '../types';

// Helper to get Turso Config from localStorage (bootstrapping)
const getTursoConfig = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('edugenius_settings') || '{}');
    return {
      url: settings.tursoUrl || "",
      authToken: settings.tursoToken || ""
    };
  } catch {
    return { url: "", authToken: "" };
  }
};

const initTurso = () => {
  const config = getTursoConfig();
  if (!config.url) return null;
  try {
    return createClient(config);
  } catch (e) {
    console.error("Failed to create Turso client:", e);
    return null;
  }
};

// SQL initialization script
const INIT_SQL = [
  `CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, title TEXT, subject TEXT, grade TEXT, topic TEXT, status TEXT, progress INTEGER, results TEXT, error TEXT, created_at TEXT, published INTEGER)`,
  `CREATE TABLE IF NOT EXISTS api_keys (key TEXT PRIMARY KEY, status TEXT, usage_count INTEGER)`,
  `CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT)`,
  `CREATE TABLE IF NOT EXISTS logs (id TEXT PRIMARY KEY, timestamp TEXT, level TEXT, message TEXT)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, name TEXT, role TEXT, active INTEGER, password TEXT)`
];

export const DB = {
  client: initTurso(),

  async init() {
    if (!this.client) {
      console.log("DB: Using Local Storage fallback.");
      return;
    }
    try {
      for (const sql of INIT_SQL) {
        await this.client.execute(sql);
      }
      // Insert default admin if users table is empty
      const users = await this.getUsers();
      if (users.length === 0) {
        await this.saveUser({ id: 'admin', username: 'hairi', name: 'Admin Utama', role: 'ADMIN', active: true, password: 'Midorima88@@' });
      }
      console.log("DB: Turso Cloud SQLite Initialized.");
    } catch (e) {
      console.error("Database Init Failed:", e);
      this.client = null; // Fallback to local if server error
    }
  },

  async testConnection(url: string, token: string): Promise<{ success: boolean; message: string }> {
    if (!url) return { success: false, message: "URL Database tidak boleh kosong." };
    try {
      const tempClient = createClient({ url, authToken: token });
      await tempClient.execute("SELECT 1");
      return { success: true, message: "Koneksi berhasil! Database siap digunakan." };
    } catch (e: any) {
      console.error("Test Connection Failed:", e);
      return { success: false, message: `Koneksi gagal: ${e.message}` };
    }
  },

  getConnectionType(): 'TURSO' | 'LOCAL' {
    return this.client ? 'TURSO' : 'LOCAL';
  },

  async getJobs(): Promise<QuizJob[]> {
    if (!this.client) return JSON.parse(localStorage.getItem('edugenius_jobs') || '[]');
    try {
      const rs = await this.client.execute("SELECT * FROM jobs ORDER BY created_at DESC");
      return rs.rows.map(row => ({
        ...row,
        progress: Number(row.progress),
        published: Boolean(row.published),
        results: JSON.parse(row.results as string || '[]')
      } as any));
    } catch (e) {
      console.error("Turso GetJobs failed, falling back to local", e);
      return JSON.parse(localStorage.getItem('edugenius_jobs') || '[]');
    }
  },

  async saveJob(job: QuizJob): Promise<void> {
    if (!this.client) {
      const jobs = await this.getJobs();
      const index = jobs.findIndex(j => j.id === job.id);
      if (index > -1) jobs[index] = job; else jobs.push(job);
      localStorage.setItem('edugenius_jobs', JSON.stringify(jobs));
      return;
    }
    await this.client.execute({
      sql: "INSERT INTO jobs (id, title, subject, grade, topic, status, progress, results, error, created_at, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, status=excluded.status, progress=excluded.progress, results=excluded.results, error=excluded.error, published=excluded.published",
      args: [job.id, job.title, job.subject, job.grade, job.topic, job.status, job.progress, JSON.stringify(job.results || []), job.error || null, job.createdAt, job.published ? 1 : 0]
    });
  },

  async deleteJob(id: string): Promise<void> {
    if (!this.client) {
      const jobs = (await this.getJobs()).filter(j => j.id !== id);
      localStorage.setItem('edugenius_jobs', JSON.stringify(jobs));
      return;
    }
    await this.client.execute({ sql: "DELETE FROM jobs WHERE id = ?", args: [id] });
  },

  async getApiKeys(): Promise<ApiKey[]> {
    if (!this.client) return JSON.parse(localStorage.getItem('edugenius_keys') || '[]');
    try {
      const rs = await this.client.execute("SELECT * FROM api_keys");
      return rs.rows.map(row => ({ key: row.key, status: row.status, usageCount: Number(row.usage_count) } as any));
    } catch {
      return JSON.parse(localStorage.getItem('edugenius_keys') || '[]');
    }
  },

  async saveApiKeys(keys: ApiKey[]): Promise<void> {
    if (!this.client) {
      localStorage.setItem('edugenius_keys', JSON.stringify(keys));
      return;
    }
    await this.client.execute("DELETE FROM api_keys");
    for (const k of keys) {
      await this.client.execute({
        sql: "INSERT INTO api_keys (key, status, usage_count) VALUES (?, ?, ?)",
        args: [k.key, k.status, k.usageCount]
      });
    }
  },

  async updateApiKeyUsage(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.execute({
      sql: "UPDATE api_keys SET usage_count = usage_count + 1 WHERE key = ?",
      args: [key]
    });
  },

  async getSettings(): Promise<SiteSettings> {
    const defaults: SiteSettings = {
      siteName: 'EduGenius AI',
      seoDescription: 'Pembuat soal otomatis terbaik di Indonesia.',
      timezone: 'Asia/Jakarta',
      isMaintenance: false,
      autoRotation: true,
      aiFactChecker: true,
      tasksPerHour: 10,
      delayBetweenTasks: 60,
    };
    if (!this.client) {
      const saved = localStorage.getItem('edugenius_settings');
      return saved ? JSON.parse(saved) : defaults;
    }
    try {
      const rs = await this.client.execute("SELECT data FROM settings WHERE id = 'main'");
      if (rs.rows.length === 0) return defaults;
      return JSON.parse(rs.rows[0].data as string);
    } catch {
      return defaults;
    }
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    localStorage.setItem('edugenius_settings', JSON.stringify(settings));
    if (!this.client) return;
    await this.client.execute({
      sql: "INSERT INTO settings (id, data) VALUES ('main', ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      args: [JSON.stringify(settings)]
    });
    // Re-init client if settings changed
    this.client = initTurso();
  },

  async getLogs(): Promise<LogEntry[]> {
    if (!this.client) return JSON.parse(localStorage.getItem('edugenius_logs') || '[]');
    try {
      const rs = await this.client.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100");
      return rs.rows.map(row => ({ ...row } as any));
    } catch {
      return JSON.parse(localStorage.getItem('edugenius_logs') || '[]');
    }
  },

  async addLog(level: LogEntry['level'], message: string): Promise<void> {
    const log = { id: Date.now().toString(), timestamp: new Date().toISOString(), level, message };
    if (!this.client) {
      const logs = JSON.parse(localStorage.getItem('edugenius_logs') || '[]');
      logs.unshift(log);
      localStorage.setItem('edugenius_logs', JSON.stringify(logs.slice(0, 100)));
      return;
    }
    await this.client.execute({
      sql: "INSERT INTO logs (id, timestamp, level, message) VALUES (?, ?, ?, ?)",
      args: [log.id, log.timestamp, log.level, log.message]
    });
  },

  async clearLogs(): Promise<void> {
    if (!this.client) {
      localStorage.removeItem('edugenius_logs');
      return;
    }
    await this.client.execute("DELETE FROM logs");
  },

  async getUsers(): Promise<User[]> {
    if (!this.client) {
      const saved = localStorage.getItem('edugenius_users');
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const rs = await this.client.execute("SELECT * FROM users");
      return rs.rows.map(row => ({
        ...row,
        active: Boolean(row.active)
      } as any));
    } catch {
      return JSON.parse(localStorage.getItem('edugenius_users') || '[]');
    }
  },

  async saveUser(user: User): Promise<void> {
    if (!this.client) {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index > -1) users[index] = user; else users.push(user);
      localStorage.setItem('edugenius_users', JSON.stringify(users));
      return;
    }
    await this.client.execute({
      sql: "INSERT INTO users (id, username, name, role, active, password) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, name=excluded.name, role=excluded.role, active=excluded.active, password=excluded.password",
      args: [user.id, user.username, user.name, user.role, user.active ? 1 : 0, user.password || '']
    });
  },

  async deleteUser(id: string): Promise<void> {
    if (!this.client) {
      const users = (await this.getUsers()).filter(u => u.id !== id);
      localStorage.setItem('edugenius_users', JSON.stringify(users));
      return;
    }
    await this.client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  }
};

// Auto-init DB tables
DB.init();
