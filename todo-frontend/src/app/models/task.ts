export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  createdAt?: Date;
  editing?: boolean;
  dueDate?: Date | null;
  hasDeadline?: boolean;
}