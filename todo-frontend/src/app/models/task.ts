export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: Date;
  editing?: boolean;
  dueDate?: Date | null;
  hasDeadline?: boolean;
}