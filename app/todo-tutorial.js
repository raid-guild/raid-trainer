"use client";

import { useEffect, useState, useTransition } from "react";

const initialForm = {
  title: "",
  detail: ""
};

export default function TodoTutorial() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadTodos() {
    const response = await fetch("/app/api/todos", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Unable to load todos");
    }

    const data = await response.json();
    setTodos(data.todos);
  }

  useEffect(() => {
    startTransition(() => {
      loadTodos().catch((loadError) => {
        setError(loadError.message);
      });
    });
  }, []);

  async function submitTodo(event) {
    event.preventDefault();
    setError("");

    const response = await fetch("/app/api/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Unable to create todo" }));
      setError(data.error || "Unable to create todo");
      return;
    }

    const data = await response.json();
    setTodos((current) => [data.todo, ...current]);
    setForm(initialForm);
  }

  async function toggleTodo(id, completed) {
    const response = await fetch(`/app/api/todos/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ completed: !completed })
    });

    if (!response.ok) {
      setError("Unable to update todo");
      return;
    }

    const data = await response.json();
    setTodos((current) => current.map((todo) => (todo.id === id ? data.todo : todo)));
  }

  async function deleteTodo(id) {
    const response = await fetch(`/app/api/todos/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Unable to delete todo");
      return;
    }

    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Raid Guild x Pinata</p>
            <h1>Starter-builder for small hosted agent apps.</h1>
            <p className="lede">
              This template already has the useful bones: a landing page, App Router API
              endpoints, a persistent SQLite database in the workspace, and a pattern for
              serving local assets back through the app.
            </p>
            <div className="meta-row">
              <span>UI: <code>/app</code></span>
              <span>API: <code>/app/api/todos</code></span>
              <span>Asset: <code>/app/api/avatar</code></span>
            </div>
          </div>
          <div className="avatar-panel">
            <img
              className="avatar"
              src="/app/api/avatar"
              alt="Raid Guild themed starter avatar"
              width="160"
              height="160"
            />
            <p className="avatar-caption">Served from <code>workspace/assets</code></p>
          </div>
        </header>

        <section className="tutorial-grid">
          <article className="card">
            <h2>Start with a focused app</h2>
            <p className="card-copy">
              Good next versions for this stack are narrow and complete: a workout assistant,
              kitchen aide, study coach, travel planner, creator studio helper, or household ops app.
              The todo flow below is just the starter slice you can reshape first.
            </p>
            <ul className="route-list">
              <li>A workout assistant can track routines, sessions, and streaks.</li>
              <li>A kitchen aide can manage pantry items, meal ideas, and shopping lists.</li>
              <li>A study coach can store topics, review prompts, and daily progress.</li>
              <li>A creator helper can track ideas, drafts, assets, and publishing steps.</li>
            </ul>
          </article>

          <article className="card">
            <h2>Use the starter slice</h2>
            <p className="card-copy">
              Create entries through the API. They persist to <code>workspace/data/todos.db</code>
              and demonstrate the simplest useful data loop in this template.
            </p>
            <form className="todo-form" onSubmit={submitTodo}>
              <label>
                Title
                <input
                  required
                  maxLength={80}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Ship first agent tutorial"
                />
              </label>
              <label>
                Detail
                <textarea
                  rows="4"
                  maxLength={240}
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, detail: event.target.value }))
                  }
                  placeholder="Describe the task or note what the API should demonstrate."
                />
              </label>
              <button type="submit" disabled={isPending}>
                Save todo
              </button>
            </form>
            {error ? <p className="error-banner">{error}</p> : null}
          </article>

          <article className="card">
            <h2>What is already wired</h2>
            <ul className="route-list">
              <li><code>GET /app/api/todos</code> returns the current list.</li>
              <li><code>POST /app/api/todos</code> creates a todo from JSON.</li>
              <li><code>PATCH /app/api/todos/:id</code> toggles completion.</li>
              <li><code>DELETE /app/api/todos/:id</code> removes an item.</li>
              <li><code>GET /app/api/avatar</code> streams an image from the workspace.</li>
            </ul>
          </article>
        </section>

        <section className="card">
          <div className="list-head">
            <h2>Todos</h2>
            <p>{todos.length} item{todos.length === 1 ? "" : "s"}</p>
          </div>
          <div className="todo-list">
            {todos.length === 0 ? (
              <p className="empty-state">No todos yet. Create the first one above.</p>
            ) : (
              todos.map((todo) => (
                <article className="todo-item" key={todo.id}>
                  <div>
                    <div className="todo-row">
                      <h3>{todo.title}</h3>
                      <span className={todo.completed ? "status done" : "status open"}>
                        {todo.completed ? "Done" : "Open"}
                      </span>
                    </div>
                    {todo.detail ? <p>{todo.detail}</p> : null}
                    <p className="todo-meta">Created {new Date(todo.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="todo-actions">
                    <button type="button" onClick={() => toggleTodo(todo.id, todo.completed)}>
                      {todo.completed ? "Reopen" : "Complete"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
