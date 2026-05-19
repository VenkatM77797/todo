export type TaskCategory = "GROCERY" | "EDUCATIONAL" | "HOME" | "PERSONAL" | "WORK";

export type TaskFilter = "all" | "today" | "scheduled" | "overdue";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  dueDate?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  all: number;
  completed: number;
  today: number;
  scheduled: number;
  overdue: number;
  categories: Array<{
    category: TaskCategory;
    count: number;
  }>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  completed?: boolean;
};
