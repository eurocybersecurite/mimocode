import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const DB_PATH = path.join(os.homedir(), '.mimocode', 'mimocode.db');

let dbInstance: Database | null = null;

export async function getDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  await fs.ensureDir(path.dirname(DB_PATH));
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT,
      workspace TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      role TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS project_context (
      workspace TEXT PRIMARY KEY,
      context TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return dbInstance;
}

export async function saveMessage(sessionId: string, role: string, content: string) {
  const db = await getDB();
  await db.run(
    'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
    [sessionId, role, content]
  );
  await db.run(
    'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [sessionId]
  );
}

export async function getSessionMessages(sessionId: string) {
  const db = await getDB();
  return db.all('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC', [sessionId]);
}

export async function clearSessionMessages(sessionId: string) {
  const db = await getDB();
  await db.run('DELETE FROM messages WHERE session_id = ?', [sessionId]);
}

export async function getOrCreateSession(workspace: string, name?: string): Promise<string> {
  const db = await getDB();
  const session = await db.get('SELECT id FROM sessions WHERE workspace = ? ORDER BY updated_at DESC LIMIT 1', [workspace]);
  
  if (session) return session.id;

  const id = Math.random().toString(36).substring(2, 15);
  await db.run(
    'INSERT INTO sessions (id, name, workspace) VALUES (?, ?, ?)',
    [id, name || 'New Session', workspace]
  );
  return id;
}

export async function updateProjectContext(workspace: string, context: string) {
  const db = await getDB();
  await db.run(
    'INSERT OR REPLACE INTO project_context (workspace, context, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [workspace, context]
  );
}

export async function getProjectContext(workspace: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.get('SELECT context FROM project_context WHERE workspace = ?', [workspace]);
  return row ? row.context : null;
}
