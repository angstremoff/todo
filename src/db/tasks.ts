import SQLite, {SQLiteDatabase, ResultSet} from 'react-native-sqlite-storage';
import {Task, TaskStatus, Workspace} from '../types';

SQLite.enablePromise(true);

const DB_NAME = 'todo.db';
const DB_LOCATION = 'default';

const CREATE_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    workspace_id INTEGER
  );
`;

const CREATE_WORKSPACES_TABLE = `
  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
`;

let dbInstance: SQLiteDatabase | null = null;

const mapRowToTask = (row: any): Task => ({
  id: row.id,
  text: row.title,
  workspaceId: row.workspace_id,
  status: row.status as TaskStatus,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

const hasColumn = async (db: SQLiteDatabase, table: string, column: string) => {
  const [result] = await db.executeSql(`PRAGMA table_info(${table})`);
  return result.rows.raw().some((r: any) => r.name === column);
};

const ensureWorkspaces = async (db: SQLiteDatabase): Promise<Workspace[]> => {
  await db.executeSql(CREATE_WORKSPACES_TABLE);
  const [existing] = await db.executeSql('SELECT * FROM workspaces ORDER BY id ASC');
  return existing.rows.raw();
};

const ensureTasksStructure = async (db: SQLiteDatabase, defaultWorkspaceId: number) => {
  await db.executeSql(CREATE_TABLE_QUERY);
  const hasWorkspace = await hasColumn(db, 'tasks', 'workspace_id');
  if (!hasWorkspace) {
    await db.executeSql('ALTER TABLE tasks ADD COLUMN workspace_id INTEGER;');
  }
  if (defaultWorkspaceId) {
    await db.executeSql(
      'UPDATE tasks SET workspace_id = ? WHERE workspace_id IS NULL OR workspace_id = 0',
      [defaultWorkspaceId],
    );
  }
};

const initDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: DB_NAME,
    location: DB_LOCATION,
  });

  const workspaces = await ensureWorkspaces(dbInstance);
  const defaultWorkspaceId = workspaces[0]?.id ?? 1;
  await ensureTasksStructure(dbInstance, defaultWorkspaceId);
  return dbInstance;
};

export const getDb = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  return initDatabase();
};

export const getTasks = async (
  workspaceId: number,
  status?: TaskStatus,
): Promise<Task[]> => {
  const db = await getDb();
  const query = status
    ? 'SELECT * FROM tasks WHERE workspace_id = ? AND status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM tasks WHERE workspace_id = ? ORDER BY status, created_at DESC';
  const params = status ? [workspaceId, status] : [workspaceId];
  const [results] = await db.executeSql(query, params);
  return results.rows.raw().map(mapRowToTask);
};

export const createTask = async (input: {
  text: string;
  workspaceId: number;
}): Promise<Task> => {
  const db = await getDb();
  const now = Date.now();

  const [result] = await db.executeSql(
    'INSERT INTO tasks (title, description, status, created_at, workspace_id) VALUES (?, ?, ?, ?, ?)',
    [input.text.trim(), '', 'active', now, input.workspaceId],
  );

  const insertedId = result.insertId;
  return {
    id: insertedId ?? now,
    text: input.text.trim(),
    workspaceId: input.workspaceId,
    status: 'active',
    createdAt: now,
  };
};

export const updateTaskStatus = async (
  id: number,
  status: TaskStatus,
): Promise<void> => {
  const db = await getDb();
  const completedAt = status === 'done' ? Date.now() : null;
  await db.executeSql(
    'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
    [status, completedAt, id],
  );
};

export const deleteTask = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.executeSql('DELETE FROM tasks WHERE id = ?', [id]);
};

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const db = await getDb();
  const [results] = await db.executeSql(
    'SELECT * FROM workspaces ORDER BY id ASC',
  );
  return results.rows.raw();
};

export const createWorkspace = async (name: string): Promise<Workspace> => {
  const db = await getDb();
  const cleaned = name.trim();
  await db.executeSql('INSERT INTO workspaces (name) VALUES (?)', [cleaned]);
  const [res] = await db.executeSql(
    'SELECT * FROM workspaces WHERE name = ? ORDER BY id DESC LIMIT 1',
    [cleaned],
  );
  return res.rows.raw()[0] as Workspace;
};

export const renameWorkspace = async (
  id: number,
  name: string,
): Promise<void> => {
  const db = await getDb();
  await db.executeSql('UPDATE workspaces SET name = ? WHERE id = ?', [
    name.trim(),
    id,
  ]);
};

export const deleteWorkspace = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.executeSql('DELETE FROM tasks WHERE workspace_id = ?', [id]);
  await db.executeSql('DELETE FROM workspaces WHERE id = ?', [id]);
};
