import type { CreateTaskInput, Task, TaskFilter, TaskStats, UpdateTaskInput } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const data = await response.json();
      message = data.message ?? message;
    } catch {
      // Ignore non-JSON errors.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getTasks(filter: TaskFilter, category?: string) {
  const params = new URLSearchParams({ filter });
  if (category && category !== "ALL") params.set("category", category);
  return request<Task[]>(`/tasks?${params.toString()}`);
}

export async function getStats() {
  return request<TaskStats>("/stats");
}

export async function createTask(input: CreateTaskInput) {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteTask(id: string) {
  return request<void>(`/tasks/${id}`, {
    method: "DELETE"
  });
}
