import { z } from "zod";

export const taskCategories = ["GROCERY", "EDUCATIONAL", "HOME", "PERSONAL", "WORK"] as const;

const dueDateInput = z.union([z.string().datetime(), z.string().length(0), z.null()]);

const createDueDateSchema = dueDateInput.optional().transform((value) => {
  if (!value) return null;
  return new Date(value);
});

const updateDueDateSchema = dueDateInput.optional().transform((value) => {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(500, "Description is too long").optional().default(""),
  category: z.enum(taskCategories).optional().default("WORK"),
  dueDate: createDueDateSchema
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    category: z.enum(taskCategories).optional(),
    dueDate: updateDueDateSchema,
    completed: z.boolean().optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required"
  });

export const filterSchema = z.object({
  filter: z.enum(["all", "today", "scheduled", "overdue"]).optional().default("all"),
  category: z.enum(taskCategories).optional()
});

export function isMongoObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}
