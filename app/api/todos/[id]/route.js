import { getTodo, removeTodo, updateTodo } from "../../../../lib/todos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const todo = getTodo(Number(id));

  if (!todo) {
    return Response.json({ error: "Todo not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const updated = updateTodo(Number(id), {
    completed: Boolean(body?.completed)
  });

  return Response.json({ todo: updated });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const todo = getTodo(Number(id));

  if (!todo) {
    return Response.json({ error: "Todo not found." }, { status: 404 });
  }

  removeTodo(Number(id));
  return new Response(null, { status: 204 });
}
