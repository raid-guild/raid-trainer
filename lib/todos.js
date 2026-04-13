import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "workspace", "data");
const dbPath = path.join(dataDir, "todos.db");

fs.mkdirSync(dataDir, { recursive: true });

function withDb(run) {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    return run(db);
  } finally {
    db.close();
  }
}

function mapTodo(row) {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listTodos() {
  return withDb((db) =>
    db
      .prepare(
        `SELECT id, title, detail, completed, created_at, updated_at
         FROM todos
         ORDER BY id DESC`
      )
      .all()
      .map(mapTodo)
  );
}

export function createTodo({ title, detail = "" }) {
  return withDb((db) => {
    const insert = db.prepare(
      `INSERT INTO todos (title, detail, completed, created_at, updated_at)
       VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    const result = insert.run(title.trim(), detail.trim());

    return mapTodo(
      db
        .prepare(
          `SELECT id, title, detail, completed, created_at, updated_at
           FROM todos
           WHERE id = ?`
        )
        .get(result.lastInsertRowid)
    );
  });
}

export function getTodo(id) {
  return withDb((db) => {
    const row = db
      .prepare(
        `SELECT id, title, detail, completed, created_at, updated_at
         FROM todos
         WHERE id = ?`
      )
      .get(id);

    return row ? mapTodo(row) : null;
  });
}

export function updateTodo(id, { completed }) {
  return withDb((db) => {
    db.prepare(
      `UPDATE todos
       SET completed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(completed ? 1 : 0, id);

    const row = db
      .prepare(
        `SELECT id, title, detail, completed, created_at, updated_at
         FROM todos
         WHERE id = ?`
      )
      .get(id);

    return row ? mapTodo(row) : null;
  });
}

export function removeTodo(id) {
  return withDb((db) => db.prepare("DELETE FROM todos WHERE id = ?").run(id));
}
