import { createClient, Client } from '@libsql/client';

// Turso database connection
const db: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database tables
export async function initDatabase(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS calculations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      operation TEXT,
      operand REAL NOT NULL,
      result REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES calculations(id)
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_calculations_parent ON calculations(parent_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_calculations_user ON calculations(user_id)
  `);

  console.log('Database initialized');
}

export default db;
