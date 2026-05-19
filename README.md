# Real Full-Stack Todo App
VDSVKDNKD
A real working task manager built with:

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- ORM: Prisma

This version is not a tilted design mockup. It is a real app layout with working create, read, update, complete, delete, search, filter, category, and stats features.

## 1. Install

```bash
npm install
```

## 2. Configure environment files

Copy the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit `backend/.env`:

```env
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/todo_app?retryWrites=true&w=majority"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## 3. MongoDB Atlas checklist

In MongoDB Atlas:

1. Create a cluster.
2. Create a database user.
3. Go to Network Access.
4. Add your current IP address, or temporarily add `0.0.0.0/0` for development only.
5. Copy the connection string.
6. Replace `USERNAME`, `PASSWORD`, and cluster details in `backend/.env`.

Important: if you cannot find Database Access or Network Access, open your Atlas project sidebar. Both are under the Security section.

## 4. Generate Prisma Client and push schema

```bash
npm run prisma:generate
npm run db:push
```

## 5. Optional seed data

```bash
npm run seed
```

## 6. Start the app

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:4000/health
```

## API routes

```txt
GET    /api/tasks?filter=all&category=WORK
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/stats
```

## Common fixes

### Frontend opens but data does not load

Check that backend is running:

```txt
http://localhost:4000/health
```

### Prisma cannot connect to MongoDB

Most common causes:

- Wrong username/password in `DATABASE_URL`
- Your IP is not allowed in MongoDB Atlas Network Access
- Password contains special characters and must be URL encoded
- You did not run `npm run prisma:generate`
- You did not run `npm run db:push`

### Screen still looks like rotated phones

You are still running the older UI. Replace the project with this updated version or replace `frontend/src/App.tsx` with the new real-app dashboard code.
