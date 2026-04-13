import { createTodo, listTodos } from "../../../lib/todos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ todos: listTodos() });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const title = body?.title?.trim();
  const detail = body?.detail?.trim() || "";

  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const todo = createTodo({ title, detail });
  return Response.json({ todo }, { status: 201 });
}
