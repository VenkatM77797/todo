import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { createTaskSchema, filterSchema, isMongoObjectId, updateTaskSchema } from "./validators.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);
app.use(express.json());

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function buildWhere(filter: string, category?: string): Prisma.TaskWhereInput {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const where: Prisma.TaskWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (filter === "today") {
    where.dueDate = {
      gte: todayStart,
      lte: todayEnd
    };
  }

  if (filter === "scheduled") {
    where.dueDate = {
      gt: todayEnd
    };
  }

  if (filter === "overdue") {
    where.completed = false;
    where.dueDate = {
      lt: now
    };
  }

  return where;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "todo-backend", database: "mongodb-prisma" });
});

app.get("/api/tasks", async (req, res, next) => {
  try {
    const query = filterSchema.parse(req.query);
    const tasks = await prisma.task.findMany({
      where: buildWhere(query.filter, query.category),
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const body = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        dueDate: body.dueDate
      }
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isMongoObjectId(id)) {
      res.status(400).json({ message: "Invalid task id" });
      return;
    }

    const body = updateTaskSchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        description: body.description ?? undefined,
        dueDate: body.dueDate === undefined ? undefined : body.dueDate
      }
    });

    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isMongoObjectId(id)) {
      res.status(400).json({ message: "Invalid task id" });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/stats", async (_req, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [all, completed, today, scheduled, overdue, categories] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({ where: { dueDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.task.count({ where: { dueDate: { gt: todayEnd } } }),
      prisma.task.count({ where: { completed: false, dueDate: { lt: now } } }),
      prisma.task.groupBy({
        by: ["category"],
        _count: {
          _all: true
        }
      })
    ]);

    res.json({
      all,
      completed,
      today,
      scheduled,
      overdue,
      categories: categories.map((item) => ({
        category: item.category,
        count: item._count._all
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      issues: error.issues
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Task not found" });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Todo API running on http://localhost:${port}`);
});
