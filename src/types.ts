export type TaskStatus = 'active' | 'done';

export interface Task {
  id: number;
  text: string;
  workspaceId: number;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number | null;
}

export interface Workspace {
  id: number;
  name: string;
}
