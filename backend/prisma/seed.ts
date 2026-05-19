import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

function todayAt(hours: number, minutes: number) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function daysFromNow(days: number, hours = 10, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  await prisma.task.deleteMany();

  await prisma.task.createMany({
    data: [
      {
        title: "Project retrospective",
        description: "Write three wins and three improvements.",
        category: "WORK",
        dueDate: todayAt(16, 50),
        completed: false
      },
      {
        title: "Evening team meeting",
        description: "Share weekly status update.",
        category: "WORK",
        dueDate: todayAt(17, 30),
        completed: true
      },
      {
        title: "Create monthly deck",
        description: "Prepare the highlights section.",
        category: "EDUCATIONAL",
        dueDate: daysFromNow(2, 12, 0),
        completed: false
      },
      {
        title: "Shop for groceries",
        description: "Pick up bag, rice, milk, and fruit.",
        category: "GROCERY",
        dueDate: todayAt(18, 0),
        completed: false
      },
      {
        title: "Clean study desk",
        description: "Organize notebooks and cables.",
        category: "HOME",
        dueDate: daysFromNow(-1, 20, 0),
        completed: false
      },
      {
        title: "Plan weekend workout",
        description: "Keep it light and realistic.",
        category: "PERSONAL",
        dueDate: daysFromNow(4, 8, 0),
        completed: false
      }
    ]
  });

  console.log("Seeded demo tasks.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
