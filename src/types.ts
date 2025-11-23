export type TaskStatus = 'active' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number | null;
}
