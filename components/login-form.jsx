"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function LoginForm({ error: externalError = "", onAuthenticated }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(externalError);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setError(externalError);
  }, [externalError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(() => {
      Promise.resolve(onAuthenticated?.(password)).catch(() => {
        setError("Login failed.");
      });
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter dashboard password</CardTitle>
          <CardDescription>
            Enter the app password to load the dashboard. The hosted app validates requests with the `x-app-password` header instead of relying on cookie auth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-[color:var(--foreground)]">
              Password
              <input
                className="h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 text-base text-[color:var(--foreground)] outline-none ring-0"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
            </label>
            {error ? <p className="text-sm text-[color:var(--warning-strong)]">{error}</p> : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Checking..." : "Unlock Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
