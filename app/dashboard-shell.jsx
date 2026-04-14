"use client";

import { useEffect, useState } from "react";

import LoginForm from "../components/login-form";
import TrainerDashboard from "./trainer-dashboard";

const PASSWORD_STORAGE_KEY = "coach-spike-password";

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="ui-text-muted text-sm">Loading dashboard...</div>
    </main>
  );
}

export default function DashboardShell() {
  const [password, setPassword] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard(nextPassword) {
    const response = await fetch("/app/api/dashboard", {
      headers: {
        "x-app-password": nextPassword
      },
      cache: "no-store"
    });

    if (response.status === 401) {
      throw new Error("unauthorized");
    }

    if (!response.ok) {
      throw new Error("Unable to load dashboard.");
    }

    const data = await response.json();
    setDashboard(data.dashboard);
  }

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(PASSWORD_STORAGE_KEY);

    if (!savedPassword) {
      setIsBooting(false);
      return;
    }

    loadDashboard(savedPassword)
      .then(() => {
        setPassword(savedPassword);
        setError("");
      })
      .catch(() => {
        window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        setPassword(null);
        setDashboard(null);
      })
      .finally(() => {
        setIsBooting(false);
      });
  }, []);

  async function handleAuthenticated(nextPassword) {
    setIsBooting(true);

    try {
      await loadDashboard(nextPassword);
      window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, nextPassword);
      setPassword(nextPassword);
      setError("");
    } catch (loadError) {
      window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
      setPassword(null);
      setDashboard(null);
      setError(loadError.message === "unauthorized" ? "Incorrect password." : "Unable to load dashboard.");
    } finally {
      setIsBooting(false);
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
    setPassword(null);
    setDashboard(null);
    setError("");
  }

  if (isBooting) {
    return <LoadingState />;
  }

  if (!password || !dashboard) {
    return <LoginForm error={error} onAuthenticated={handleAuthenticated} />;
  }

  return <TrainerDashboard authPassword={password} dashboard={dashboard} onLogout={handleLogout} />;
}
