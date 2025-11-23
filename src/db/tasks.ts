import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {Task, TaskStatus} from '../types';

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
    completed_at INTEGER
  );
`;

let dbInstance: SQLiteDatabase | null = null;

const mapRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? '',
  status: row.status as TaskStatus,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

const initDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: DB_NAME,
    location: DB_LOCATION,
  });

  await dbInstance.executeSql(CREATE_TABLE_QUERY);
  return dbInstance;
};

export const getDb = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  return initDatabase();
};

export const getTasks = async (status?: TaskStatus): Promise<Task[]> => {
  const db = await getDb();
  const query = status
    ? 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM tasks ORDER BY status, created_at DESC';
  const params = status ? [status] : [];
  const [results] = await db.executeSql(query, params);
  return results.rows.raw().map(mapRowToTask);
};

export const createTask = async (input: {
  title: string;
  description?: string;
}): Promise<Task> => {
  const db = await getDb();
  const now = Date.now();

  const [result] = await db.executeSql(
    'INSERT INTO tasks (title, description, status, created_at) VALUES (?, ?, ?, ?)',
    [input.title.trim(), input.description?.trim() ?? '', 'active', now],
  );

  const insertedId = result.insertId;
  return {
    id: insertedId ?? now,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
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
