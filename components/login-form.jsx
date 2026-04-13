"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const response = await fetch("/app/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Login failed." }));
      setError(data.error || "Login failed.");
      return;
    }

    const next = searchParams.get("next") || "/app";

    startTransition(() => {
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter dashboard password</CardTitle>
          <CardDescription>
            Lightweight starter auth for the Coach Spike dashboard. Change the default password in `APP_PASSWORD`.
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
