"use client";

import { useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UtensilsCrossed
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { cn } from "../lib/utils";

const iconMap = {
  dumbbell: Dumbbell,
  utensils: UtensilsCrossed,
  moon: MoonStar,
  sparkles: Sparkles,
  flame: Flame,
  shield: ShieldCheck,
  target: Target
};

function getStatusTone(type, value) {
  const tones = {
    completion: {
      complete: "success",
      partial: "warning",
      planned: "outline",
      missed: "outline"
    },
    nutrition: {
      "on-track": "success",
      tight: "success",
      loose: "warning",
      queued: "outline"
    },
    streak: {
      live: "success",
      recovered: "warning",
      "at-risk": "outline"
    }
  };

  return tones[type][value] || "outline";
}

function ActivityDot({ tone }) {
  return (
    <span
      className={cn("h-2.5 w-2.5 rounded-full", {
        "bg-[color:var(--success)]": tone === "success",
        "bg-[color:var(--warning)]": tone === "warning",
        "bg-[color:var(--muted)]": tone === "outline"
      })}
    />
  );
}

function formatSnapshotDate(dateString) {
  return new Date(`${dateString}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

export default function TrainerDashboard({ dashboard }) {
  const [page, setPage] = useState(0);
  const [chatAction, setChatAction] = useState("");
  const weekPages = dashboard.weeklySummaries;
  const week = weekPages[page];
  const planBlocks = dashboard.planBlocks.map((block) => ({
    ...block,
    icon: iconMap[block.icon] || Dumbbell
  }));
  const profilePills = [
    `Goal: ${dashboard.profile.goal}`,
    `Schedule: ${dashboard.profile.scheduleSummary}`,
    `Setup: ${dashboard.profile.setupSummary}`,
    `Style: ${dashboard.profile.motivationStyle}`
  ];
  const reminderPills = dashboard.reminders.enabled
    ? [
        `${dashboard.reminders.preferredWindowLabel} at ${dashboard.reminders.preferredTimeLocal}`,
        `${dashboard.reminders.cadence} cadence via ${dashboard.reminders.channel}`,
        `${dashboard.reminders.daysOfWeek.join(", ")} in ${dashboard.reminders.timezone}`,
        `${dashboard.reminders.tone} tone`
      ]
    : ["Reminders are not enabled yet."];

  async function stageMainChat({ action, input, buttonLabel }) {
    setChatAction(action);

    try {
      const response = await fetch("/app/api/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-openclaw-agent-id": "main",
          "x-openclaw-session-key": "main"
        },
        body: JSON.stringify({
          model: "openclaw",
          input
        })
      });

      if (!response.ok) {
        throw new Error("Unable to stage main chat.");
      }

      window.location.href = "/chat";
    } catch (error) {
      console.error(`${buttonLabel} failed`, error);
      window.location.href = "/chat";
    } finally {
      setChatAction("");
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,242,238,0.96))] shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)] lg:p-8">
            <div className="space-y-5">
              <Badge className="w-fit" variant="default">
                {dashboard.profile.coachName} Dashboard
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-5xl lg:text-6xl">
                  Main chat runs the coaching. The dashboard shows whether you are actually doing the work.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] sm:text-lg">
                  Use the main chat for onboarding, daily updates, and plan changes. This view stays lightweight:
                  profile snapshot, current plan, trend visuals, and a weekly activity log instead of a heavy calendar.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  disabled={chatAction !== ""}
                  onClick={() =>
                    stageMainChat({
                      action: "review",
                      buttonLabel: "Open Main Chat",
                      input:
                        "The user opened the Coach Spike dashboard and wants to continue in the main chat. Start with a concise coaching check-in that references their current plan, streak, and today's priority, then ask for the single most useful next update."
                    })
                  }
                >
                  {chatAction === "review" ? "Staging Main Chat..." : "Open Main Chat"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={chatAction !== ""}
                  onClick={() =>
                    stageMainChat({
                      action: "onboarding",
                      buttonLabel: "Update Onboarding In Main Chat",
                      input:
                        "The user wants to update onboarding details from the Coach Spike dashboard. Resume in the main chat by briefly summarizing the current profile you know, then ask the highest-priority follow-up questions to update goals, schedule, equipment, limitations, food preferences, or motivation style."
                    })
                  }
                >
                  {chatAction === "onboarding"
                    ? "Staging Onboarding..."
                    : "Update Onboarding In Main Chat"}
                </Button>
              </div>
            </div>

            <Card className="bg-[rgba(12,24,19,0.93)] text-white">
              <CardHeader className="gap-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-white/12 text-white" variant="outline">
                    Today
                  </Badge>
                  <span className="text-sm text-white/70">{formatSnapshotDate(dashboard.today.date)}</span>
                </div>
                <CardTitle className="text-white">
                  Check-in {dashboard.today.checkInStatus === "open" ? "still open" : dashboard.today.checkInStatus}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {dashboard.today.workoutLabel} is queued. {dashboard.today.coachPrompt}
                  {" "}Use the main chat to log today, adjust the session, or ask for substitutions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Streak</p>
                    <p className="mt-2 text-3xl font-semibold">{dashboard.today.streakDays}</p>
                    <p className="mt-1 text-sm text-white/70">days logged</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Workout</p>
                    <p className="mt-2 text-3xl font-semibold">{dashboard.today.workoutTime}</p>
                    <p className="mt-1 text-sm text-white/70">gym block</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Protein</p>
                    <p className="mt-2 text-3xl font-semibold">{dashboard.today.proteinGrams}g</p>
                    <p className="mt-1 text-sm text-white/70">target {dashboard.today.proteinTargetGrams}g</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-white/70">
                    <span>Daily readiness</span>
                    <span>{dashboard.today.readinessScore}%</span>
                  </div>
                  <Progress className="mt-3 bg-white/12" value={dashboard.today.readinessScore} />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.9fr)]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Current plan snapshot</CardTitle>
                    <CardDescription>
                      Read-only summary from the main chat onboarding flow and the latest weekly adjustment.
                    </CardDescription>
                  </div>
                  <Badge variant="warning">Week 4 Block</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {planBlocks.map(({ title, detail, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--panel)] p-5"
                  >
                    <Icon className="h-5 w-5 text-[color:var(--primary)]" />
                    <h3 className="mt-4 font-semibold text-[color:var(--foreground)]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">{detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Weekly activity log</CardTitle>
                    <CardDescription>
                      Date-first list view with color-coded status markers instead of a full calendar grid.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((current) => Math.min(weekPages.length - 1, current + 1))}
                      disabled={page === weekPages.length - 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Older
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                      disabled={page === 0}
                    >
                      Newer
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[color:var(--panel)] p-4">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{week.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">{week.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-2"><ActivityDot tone="success" /> complete</span>
                    <span className="inline-flex items-center gap-2"><ActivityDot tone="warning" /> partial</span>
                    <span className="inline-flex items-center gap-2"><ActivityDot tone="outline" /> planned or at-risk</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {week.entries.map((entry) => (
                    <article
                      key={`${week.label}-${entry.date}`}
                      className="grid gap-4 rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4 md:grid-cols-[7rem_minmax(0,1fr)_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">{entry.date}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">session</p>
                      </div>
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">{entry.workout}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={getStatusTone("completion", entry.completion)}>{entry.completion}</Badge>
                          <Badge variant={getStatusTone("nutrition", entry.nutrition)}>{entry.nutrition}</Badge>
                          <Badge variant={getStatusTone("streak", entry.streak)}>{entry.streak}</Badge>
                        </div>
                      </div>
                      <div className="flex items-start justify-start gap-3 md:justify-end">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
                          <ActivityDot tone={getStatusTone("completion", entry.completion)} />
                          workout
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
                          <ActivityDot tone={getStatusTone("nutrition", entry.nutrition)} />
                          food
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
                          <ActivityDot tone={getStatusTone("streak", entry.streak)} />
                          streak
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile snapshot</CardTitle>
                <CardDescription>The dashboard stays read-only. Profile edits happen in the main chat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profilePills.map((pill) => (
                  <div
                    key={pill}
                    className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                  >
                    {pill}
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  disabled={chatAction !== ""}
                  onClick={() =>
                    stageMainChat({
                      action: "profile",
                      buttonLabel: "Update onboarding in main chat",
                      input:
                        "The user clicked update onboarding from the profile snapshot in the Coach Spike dashboard. Continue in the main chat with a profile refresh: restate the known goal, schedule, setup, and motivation style, then ask what changed and what should be updated first."
                    })
                  }
                >
                  {chatAction === "profile"
                    ? "Staging Profile Refresh..."
                    : "Update onboarding in main chat"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reminder preferences</CardTitle>
                <CardDescription>
                  Collect reminder timing and tone during onboarding in the main chat, then surface it here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reminderPills.map((pill) => (
                  <div
                    key={pill}
                    className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                  >
                    {pill}
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  disabled={chatAction !== ""}
                  onClick={() =>
                    stageMainChat({
                      action: "reminders",
                      buttonLabel: "Set reminders in main chat",
                      input:
                        "The user wants to set or update reminder preferences from the Coach Spike dashboard. In the main chat, collect or confirm whether reminders are enabled, timezone, preferred days, preferred time window, and reminder tone. Keep it concise and practical."
                    })
                  }
                >
                  {chatAction === "reminders"
                    ? "Staging Reminder Setup..."
                    : "Set reminders in main chat"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adherence trends</CardTitle>
                <CardDescription>Quick visual scan for calories and protein over the last week.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-7 gap-3">
                  {dashboard.nutritionTrend.map((point) => (
                    <div key={point.day} className="space-y-3 text-center">
                      <div className="flex h-40 items-end justify-center gap-2">
                        <div className="w-3 rounded-full bg-[color:var(--secondary)]" style={{ height: `${point.calories}%` }} />
                        <div className="w-3 rounded-full bg-[color:var(--primary)]" style={{ height: `${point.protein}%` }} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {point.day}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted-foreground)]">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[color:var(--primary)]" /> protein target</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[color:var(--secondary)]" /> calorie target</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coach notes</CardTitle>
                <CardDescription>Recent coach observations and prompts to follow up on in the main chat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.coachNotes.map((item, index) => {
                  const Icon = iconMap[item.icon] || Sparkles;

                  return (
                  <div
                    key={item.text}
                    className="flex gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--foreground)]">{item.text}</p>
                  </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Main-chat workflow</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Onboarding", detail: "Use the main chat to set goals, constraints, style, and schedule.", icon: CalendarDays },
                  { label: "Daily updates", detail: "Log energy, workouts, meals, and missed sessions in the main chat.", icon: TimerReset },
                  { label: "Reminders", detail: "Set reminder timing, cadence, and tone during onboarding or any later main-chat update.", icon: Sparkles },
                  { label: "Plan tuning", detail: "Use the main chat when you want Coach Spike to adapt volume, substitutions, or deload timing.", icon: Activity },
                  { label: "Dashboard role", detail: "Visual scan only: progress, trends, state summaries, and prompts that send you back to the main chat.", icon: Flame }
                ].map(({ label, detail, icon: Icon }) => (
                  <div key={label} className="rounded-[22px] bg-[color:var(--panel)] p-4">
                    <Icon className="h-5 w-5 text-[color:var(--primary)]" />
                    <p className="mt-3 font-medium text-[color:var(--foreground)]">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">{detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
