import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Filter,
  Inbox,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from "lucide-react";
import { createTask, deleteTask, getStats, getTasks, updateTask } from "./services/api";
import type { CreateTaskInput, Task, TaskCategory, TaskFilter, TaskStats, UpdateTaskInput } from "./types";

const categoryOptions: Array<{ value: TaskCategory; label: string; color: string }> = [
  { value: "WORK", label: "Daily Work", color: "bg-pink-100 text-pink-700 ring-pink-200" },
  { value: "GROCERY", label: "Grocery", color: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200" },
  { value: "EDUCATIONAL", label: "Educational", color: "bg-indigo-100 text-indigo-700 ring-indigo-200" },
  { value: "HOME", label: "Home Related", color: "bg-yellow-100 text-yellow-800 ring-yellow-200" },
  { value: "PERSONAL", label: "Personal Related", color: "bg-emerald-100 text-emerald-700 ring-emerald-200" }
];

const filters: Array<{ value: TaskFilter; label: string; description: string; icon: typeof Inbox }> = [
  { value: "all", label: "All tasks", description: "Everything saved", icon: Inbox },
  { value: "today", label: "Today", description: "Due today", icon: Clock3 },
  { value: "scheduled", label: "Scheduled", description: "Future tasks", icon: CalendarDays },
  { value: "overdue", label: "Overdue", description: "Needs action", icon: RefreshCw }
];

const emptyStats: TaskStats = {
  all: 0,
  completed: 0,
  today: 0,
  scheduled: 0,
  overdue: 0,
  categories: []
};

const emptyForm: CreateTaskInput = {
  title: "",
  description: "",
  category: "WORK",
  dueDate: ""
};

function getCategory(value: TaskCategory) {
  return categoryOptions.find((category) => category.value === value) ?? categoryOptions[0];
}

function getStat(stats: TaskStats, filter: TaskFilter) {
  if (filter === "today") return stats.today;
  if (filter === "scheduled") return stats.scheduled;
  if (filter === "overdue") return stats.overdue;
  return stats.all;
}

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toApiDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function StatCard({ title, value, sub }: { title: string; value: number; sub: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{sub}</p>
      </div>
    </div>
  );
}

function TaskForm({ saving, onCreate }: { saving: boolean; onCreate: (input: CreateTaskInput) => Promise<void> }) {
  const [form, setForm] = useState<CreateTaskInput>(emptyForm);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;

    await onCreate({
      title: form.title.trim(),
      description: form.description?.trim() ?? "",
      category: form.category,
      dueDate: toApiDate(form.dueDate)
    });

    setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">Create task</h2>
          <p className="text-sm text-slate-500">Saved directly to MongoDB through the backend API.</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
          <Plus className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Task title"
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
        />

        <textarea
          value={form.description ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Optional note"
          rows={3}
          className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as TaskCategory }))}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
          >
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={form.dueDate ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add task
        </button>
      </div>
    </form>
  );
}

function TaskCard({
  task,
  editing,
  draft,
  onChangeDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete
}: {
  task: Task;
  editing: boolean;
  draft: UpdateTaskInput & { dueDate?: string | null };
  onChangeDraft: (input: UpdateTaskInput & { dueDate?: string | null }) => void;
  onStartEdit: (task: Task) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
}) {
  const category = getCategory(task.category);

  if (editing) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-2 ring-indigo-200">
        <div className="grid gap-3">
          <input
            value={draft.title ?? ""}
            onChange={(event) => onChangeDraft({ ...draft, title: event.target.value })}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:bg-white"
          />
          <textarea
            value={draft.description ?? ""}
            onChange={(event) => onChangeDraft({ ...draft, description: event.target.value })}
            rows={3}
            className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={draft.category ?? "WORK"}
              onChange={(event) => onChangeDraft({ ...draft, category: event.target.value as TaskCategory })}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={draft.dueDate ?? ""}
              onChange={(event) => onChangeDraft({ ...draft, dueDate: event.target.value })}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(task)}
          className={classNames(
            "mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition",
            task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent hover:border-indigo-400"
          )}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={classNames("rounded-full px-3 py-1 text-xs font-bold ring-1", category.color)}>{category.label}</span>
            <span
              className={classNames(
                "rounded-full px-3 py-1 text-xs font-bold ring-1",
                isOverdue(task) ? "bg-red-50 text-red-700 ring-red-200" : "bg-slate-100 text-slate-600 ring-slate-200"
              )}
            >
              {formatDateTime(task.dueDate)}
            </span>
          </div>

          <h3 className={classNames("mt-3 text-lg font-bold tracking-tight", task.completed ? "text-slate-400 line-through" : "text-slate-950")}>
            {task.title}
          </h3>

          {task.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{task.description}</p> : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => onStartEdit(task)}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700"
            aria-label="Edit task"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>(emptyStats);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UpdateTaskInput & { dueDate?: string | null }>({});

  const loadData = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [taskData, statData] = await Promise.all([getTasks(filter, categoryFilter), getStats()]);
      setTasks(taskData);
      setStats(statData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to backend");
    } finally {
      setLoading(false);
    }
  }, [filter, categoryFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return tasks;
    return tasks.filter((task) => {
      const category = getCategory(task.category).label.toLowerCase();
      return `${task.title} ${task.description ?? ""} ${category}`.toLowerCase().includes(search);
    });
  }, [query, tasks]);

  const completionPercent = stats.all > 0 ? Math.round((stats.completed / stats.all) * 100) : 0;

  async function refreshAfterChange() {
    const [taskData, statData] = await Promise.all([getTasks(filter, categoryFilter), getStats()]);
    setTasks(taskData);
    setStats(statData);
  }

  async function handleCreate(input: CreateTaskInput) {
    setSaving(true);
    setError("");
    try {
      await createTask(input);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task: Task) {
    setError("");
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed: !item.completed } : item)));
    try {
      await updateTask(task.id, { completed: !task.completed });
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
      await refreshAfterChange();
    }
  }

  async function handleDelete(task: Task) {
    const shouldDelete = window.confirm(`Delete "${task.title}"?`);
    if (!shouldDelete) return;

    setError("");
    try {
      await deleteTask(task.id);
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task");
    }
  }

  function handleStartEdit(task: Task) {
    setEditingId(task.id);
    setEditDraft({
      title: task.title,
      description: task.description ?? "",
      category: task.category,
      dueDate: toLocalInputValue(task.dueDate)
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    if (!editDraft.title?.trim()) {
      setError("Task title is required");
      return;
    }

    setError("");
    try {
      await updateTask(editingId, {
        title: editDraft.title.trim(),
        description: typeof editDraft.description === "string" ? editDraft.description.trim() : "",
        category: editDraft.category,
        dueDate: toApiDate(editDraft.dueDate)
      });
      setEditingId(null);
      setEditDraft({});
      await refreshAfterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task");
    }
  }

  return (

        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_330px]">
          <aside className="space-y-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-slate-500">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <div className="space-y-2">
                {filters.map((item) => {
                  const Icon = item.icon;
                  const active = item.value === filter;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      className={classNames(
                        "flex w-full items-center justify-between rounded-2xl p-3 text-left transition",
                        active ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={classNames("grid h-10 w-10 place-items-center rounded-xl", active ? "bg-white/15" : "bg-white")}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold">{item.label}</span>
                          <span className={classNames("block text-xs", active ? "text-slate-300" : "text-slate-500")}>{item.description}</span>
                        </span>
                      </span>
                      <span className={classNames("rounded-full px-2.5 py-1 text-xs font-bold", active ? "bg-white text-slate-950" : "bg-white text-slate-600")}>
                        {getStat(stats, item.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <label className="mb-2 block px-1 text-sm font-bold text-slate-500">Category</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as TaskCategory | "ALL")}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:bg-white"
              >
                <option value="ALL">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="All tasks" value={stats.all} sub={`${completionPercent}% done`} />
              <StatCard title="Today" value={stats.today} sub="due now" />
              <StatCard title="Overdue" value={stats.overdue} sub="open" />
            </div>

            <TaskForm saving={saving} onCreate={handleCreate} />

            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">Tasks</h2>
                  <p className="text-sm text-slate-500">
                    Showing {filteredTasks.length} of {tasks.length} task{tasks.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white sm:w-64"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid place-items-center rounded-3xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Loading from backend...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="grid place-items-center rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-500">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">No tasks found</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">Create a new task or change your filter/category.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    editing={editingId === task.id}
                    draft={editDraft}
                    onChangeDraft={setEditDraft}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditDraft({});
                    }}
                    onSaveEdit={handleSaveEdit}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-950">Progress</h2>
                  <p className="text-sm text-slate-500">Completed tasks</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                  <span>{stats.completed} completed</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-black tracking-tight text-slate-950">Categories</h2>
              <p className="text-sm text-slate-500">Live count from MongoDB</p>

              <div className="mt-4 space-y-3">
                {categoryOptions.map((category) => {
                  const found = stats.categories.find((item) => item.category === category.value);
                  const count = found?.count ?? 0;
                  return (
                    <button
                      key={category.value}
                      onClick={() => setCategoryFilter(category.value)}
                      className={classNames(
                        "flex w-full items-center justify-between rounded-2xl p-3 text-left ring-1 transition hover:-translate-y-0.5",
                        category.color,
                        categoryFilter === category.value && "ring-2 ring-slate-950"
                      )}
                    >
                      <span className="text-sm font-bold">{category.label}</span>
                      <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
  );
}
