import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "workspace", "data");
const dbPath = path.join(dataDir, "trainer.db");

fs.mkdirSync(dataDir, { recursive: true });

function withDb(run) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      coach_name TEXT NOT NULL,
      athlete_name TEXT NOT NULL,
      goal TEXT NOT NULL,
      schedule_summary TEXT NOT NULL,
      setup_summary TEXT NOT NULL,
      motivation_style TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plan_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date TEXT NOT NULL UNIQUE,
      workout_label TEXT NOT NULL,
      workout_time TEXT NOT NULL,
      check_in_status TEXT NOT NULL,
      readiness_score INTEGER NOT NULL,
      protein_grams INTEGER NOT NULL,
      protein_target_grams INTEGER NOT NULL,
      streak_days INTEGER NOT NULL,
      coach_prompt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      summary TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activity_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      activity_date TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      completion_status TEXT NOT NULL,
      nutrition_status TEXT NOT NULL,
      streak_status TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (week_id) REFERENCES weekly_summaries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nutrition_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_label TEXT NOT NULL,
      protein_percent INTEGER NOT NULL,
      calories_percent INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS coach_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reminder_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      reminders_enabled INTEGER NOT NULL DEFAULT 0,
      timezone TEXT NOT NULL DEFAULT 'America/Denver',
      cadence TEXT NOT NULL DEFAULT 'daily',
      preferred_window_label TEXT NOT NULL DEFAULT '',
      preferred_time_local TEXT NOT NULL DEFAULT '',
      days_of_week TEXT NOT NULL DEFAULT '',
      tone TEXT NOT NULL DEFAULT 'supportive',
      channel TEXT NOT NULL DEFAULT 'in-app',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS check_in_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date TEXT NOT NULL,
      energy_level INTEGER,
      sleep_hours REAL,
      mood TEXT NOT NULL DEFAULT '',
      soreness TEXT NOT NULL DEFAULT '',
      workout_status TEXT NOT NULL DEFAULT '',
      nutrition_status TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDatabase(db);

  try {
    return run(db);
  } finally {
    db.close();
  }
}

function seedDatabase(db) {
  const profileCount = db.prepare("SELECT COUNT(*) AS count FROM profile").get().count;
  if (profileCount > 0) {
    return;
  }

  const insertProfile = db.prepare(`
    INSERT INTO profile (
      id,
      coach_name,
      athlete_name,
      goal,
      schedule_summary,
      setup_summary,
      motivation_style,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPlanBlock = db.prepare(`
    INSERT INTO plan_blocks (title, detail, icon, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertSnapshot = db.prepare(`
    INSERT INTO daily_snapshots (
      snapshot_date,
      workout_label,
      workout_time,
      check_in_status,
      readiness_score,
      protein_grams,
      protein_target_grams,
      streak_days,
      coach_prompt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWeek = db.prepare(`
    INSERT INTO weekly_summaries (label, summary, sort_order)
    VALUES (?, ?, ?)
  `);

  const insertEntry = db.prepare(`
    INSERT INTO activity_entries (
      week_id,
      activity_date,
      workout_name,
      completion_status,
      nutrition_status,
      streak_status,
      sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTrend = db.prepare(`
    INSERT INTO nutrition_trends (day_label, protein_percent, calories_percent, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO coach_notes (note, icon, sort_order)
    VALUES (?, ?, ?)
  `);

  const insertReminderPreferences = db.prepare(`
    INSERT INTO reminder_preferences (
      id,
      reminders_enabled,
      timezone,
      cadence,
      preferred_window_label,
      preferred_time_local,
      days_of_week,
      tone,
      channel,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertProfile.run(
      1,
      "Coach Spike",
      "Alex",
      "Lean muscle + consistency",
      "Early mornings, 45-60 min windows",
      "Commercial gym with hotel dumbbells as backup",
      "Cheeky accountability, not drill-sergeant",
      "2026-04-13T06:10:00Z"
    );

    [
      ["Strength split", "4 lift days, 1 conditioning day, 2 recovery slots", "dumbbell", 0],
      ["Nutrition target", "2,250 kcal, 180g protein, higher carbs around lifts", "utensils", 1],
      ["Recovery floor", "7.5h sleep average and one full rest block weekly", "moon", 2]
    ].forEach((row) => insertPlanBlock.run(...row));

    insertSnapshot.run(
      "2026-04-13",
      "Lower body strength",
      "6:30 AM",
      "open",
      72,
      142,
      180,
      12,
      "Coach wants energy, sleep, and soreness before finalizing the accessory block."
    );

    [
      [
        "Apr 8 - Apr 14",
        "Solid compliance week. One skipped accessory block, but protein and sleep stayed on target.",
        0,
        [
          ["2026-04-08", "Lower Body Strength", "complete", "on-track", "live"],
          ["2026-04-09", "Mobility + Zone 2", "complete", "on-track", "live"],
          ["2026-04-10", "Upper Push + Pull", "complete", "tight", "live"],
          ["2026-04-11", "Recovery Walk", "partial", "on-track", "live"],
          ["2026-04-12", "Posterior Chain", "complete", "on-track", "live"],
          ["2026-04-13", "Conditioning Intervals", "planned", "queued", "at-risk"],
          ["2026-04-14", "Rest + Meal Prep", "planned", "queued", "at-risk"]
        ]
      ],
      [
        "Apr 1 - Apr 7",
        "Travel disrupted timing midweek, but check-ins stayed consistent and volume was recovered by Sunday.",
        1,
        [
          ["2026-04-01", "Lower Body Strength", "complete", "on-track", "live"],
          ["2026-04-02", "Recovery Walk", "complete", "tight", "live"],
          ["2026-04-03", "Hotel Dumbbell Circuit", "partial", "loose", "live"],
          ["2026-04-04", "Travel Day", "missed", "loose", "at-risk"],
          ["2026-04-05", "Upper Push + Pull", "complete", "on-track", "recovered"],
          ["2026-04-06", "Conditioning Intervals", "complete", "on-track", "recovered"],
          ["2026-04-07", "Rest + Stretch", "complete", "tight", "recovered"]
        ]
      ],
      [
        "Mar 25 - Mar 31",
        "Great output week. Progressive overload landed on both main lifts and adherence stayed high.",
        2,
        [
          ["2026-03-25", "Lower Body Strength", "complete", "on-track", "live"],
          ["2026-03-26", "Mobility + Core", "complete", "on-track", "live"],
          ["2026-03-27", "Upper Push + Pull", "complete", "tight", "live"],
          ["2026-03-28", "Recovery Walk", "complete", "on-track", "live"],
          ["2026-03-29", "Posterior Chain", "complete", "on-track", "live"],
          ["2026-03-30", "Conditioning Intervals", "partial", "tight", "live"],
          ["2026-03-31", "Rest + Meal Prep", "complete", "on-track", "live"]
        ]
      ]
    ].forEach(([label, summary, sortOrder, entries]) => {
      const result = insertWeek.run(label, summary, sortOrder);

      entries.forEach(([activityDate, workoutName, completion, nutrition, streak], index) => {
        insertEntry.run(
          result.lastInsertRowid,
          activityDate,
          workoutName,
          completion,
          nutrition,
          streak,
          index
        );
      });
    });

    [
      ["Mon", 91, 84, 0],
      ["Tue", 88, 79, 1],
      ["Wed", 95, 90, 2],
      ["Thu", 76, 72, 3],
      ["Fri", 93, 87, 4],
      ["Sat", 62, 58, 5],
      ["Sun", 0, 0, 6]
    ].forEach((row) => insertTrend.run(...row));

    [
      ["Coach Spike adjusted Saturday volume after Thursday travel fatigue.", "sparkles", 0],
      ["Protein average is up 11% week over week.", "flame", 1],
      ["Sleep dipped below target once. Coach flagged recovery, not intensity.", "shield", 2],
      ["Next chat topic: swap machine row for cable row if the gym is crowded.", "target", 3]
    ].forEach((row) => insertNote.run(...row));

    insertReminderPreferences.run(
      1,
      1,
      "America/Denver",
      "daily",
      "Weekday mornings",
      "07:15",
      JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
      "cheeky",
      "in-app",
      "2026-04-13T06:15:00Z"
    );
  });

  transaction();
}

function formatDateLabel(dateString) {
  return new Date(`${dateString}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC"
  });
}

export function getDashboardData() {
  return withDb((db) => {
    const profile = db
      .prepare(
        `SELECT coach_name, athlete_name, goal, schedule_summary, setup_summary, motivation_style, updated_at
         FROM profile
         WHERE id = 1`
      )
      .get();

    const today = db
      .prepare(
        `SELECT snapshot_date, workout_label, workout_time, check_in_status, readiness_score,
                protein_grams, protein_target_grams, streak_days, coach_prompt
         FROM daily_snapshots
         ORDER BY snapshot_date DESC
         LIMIT 1`
      )
      .get();

    const planBlocks = db
      .prepare(
        `SELECT title, detail, icon
         FROM plan_blocks
         ORDER BY sort_order ASC, id ASC`
      )
      .all();

    const weeklySummaries = db
      .prepare(
        `SELECT id, label, summary
         FROM weekly_summaries
         ORDER BY sort_order ASC, id ASC`
      )
      .all()
      .map((week) => ({
        ...week,
        entries: db
          .prepare(
            `SELECT activity_date, workout_name, completion_status, nutrition_status, streak_status
             FROM activity_entries
             WHERE week_id = ?
             ORDER BY sort_order ASC, id ASC`
          )
          .all(week.id)
          .map((entry) => ({
            date: formatDateLabel(entry.activity_date),
            workout: entry.workout_name,
            completion: entry.completion_status,
            nutrition: entry.nutrition_status,
            streak: entry.streak_status
          }))
      }));

    const nutritionTrend = db
      .prepare(
        `SELECT day_label, protein_percent, calories_percent
         FROM nutrition_trends
         ORDER BY sort_order ASC, id ASC`
      )
      .all()
      .map((row) => ({
        day: row.day_label,
        protein: row.protein_percent,
        calories: row.calories_percent
      }));

    const coachNotes = db
      .prepare(
        `SELECT note, icon
         FROM coach_notes
         ORDER BY sort_order ASC, id ASC`
      )
      .all()
      .map((row) => ({
        text: row.note,
        icon: row.icon
      }));

    const reminderPreferences = db
      .prepare(
        `SELECT reminders_enabled, timezone, cadence, preferred_window_label, preferred_time_local,
                days_of_week, tone, channel, updated_at
         FROM reminder_preferences
         WHERE id = 1`
      )
      .get();

    return {
      profile: {
        coachName: profile.coach_name,
        athleteName: profile.athlete_name,
        goal: profile.goal,
        scheduleSummary: profile.schedule_summary,
        setupSummary: profile.setup_summary,
        motivationStyle: profile.motivation_style,
        updatedAt: profile.updated_at
      },
      today: {
        date: today.snapshot_date,
        workoutLabel: today.workout_label,
        workoutTime: today.workout_time,
        checkInStatus: today.check_in_status,
        readinessScore: today.readiness_score,
        proteinGrams: today.protein_grams,
        proteinTargetGrams: today.protein_target_grams,
        streakDays: today.streak_days,
        coachPrompt: today.coach_prompt
      },
      planBlocks,
      weeklySummaries: weeklySummaries.map(({ id, ...week }) => week),
      nutritionTrend,
      coachNotes,
      reminders: {
        enabled: Boolean(reminderPreferences.reminders_enabled),
        timezone: reminderPreferences.timezone,
        cadence: reminderPreferences.cadence,
        preferredWindowLabel: reminderPreferences.preferred_window_label,
        preferredTimeLocal: reminderPreferences.preferred_time_local,
        daysOfWeek: JSON.parse(reminderPreferences.days_of_week || "[]"),
        tone: reminderPreferences.tone,
        channel: reminderPreferences.channel,
        updatedAt: reminderPreferences.updated_at
      }
    };
  });
}

export function saveOnboarding({
  athleteName,
  goal,
  scheduleSummary,
  setupSummary,
  motivationStyle,
  reminders
}) {
  return withDb((db) => {
    const existingProfile = db
      .prepare(
        `SELECT coach_name
         FROM profile
         WHERE id = 1`
      )
      .get();

    const coachName = existingProfile?.coach_name || "Coach Spike";

    db.prepare(
      `INSERT INTO profile (
         id,
         coach_name,
         athlete_name,
         goal,
         schedule_summary,
         setup_summary,
         motivation_style,
         updated_at
       ) VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         coach_name = excluded.coach_name,
         athlete_name = excluded.athlete_name,
         goal = excluded.goal,
         schedule_summary = excluded.schedule_summary,
         setup_summary = excluded.setup_summary,
         motivation_style = excluded.motivation_style,
         updated_at = CURRENT_TIMESTAMP`
    ).run(
      coachName,
      athleteName?.trim() || "Athlete",
      goal?.trim() || "General fitness",
      scheduleSummary?.trim() || "Schedule not captured yet",
      setupSummary?.trim() || "Setup not captured yet",
      motivationStyle?.trim() || "Practical"
    );

    if (reminders) {
      db.prepare(
        `INSERT INTO reminder_preferences (
           id,
           reminders_enabled,
           timezone,
           cadence,
           preferred_window_label,
           preferred_time_local,
           days_of_week,
           tone,
           channel,
           updated_at
         ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           reminders_enabled = excluded.reminders_enabled,
           timezone = excluded.timezone,
           cadence = excluded.cadence,
           preferred_window_label = excluded.preferred_window_label,
           preferred_time_local = excluded.preferred_time_local,
           days_of_week = excluded.days_of_week,
           tone = excluded.tone,
           channel = excluded.channel,
           updated_at = CURRENT_TIMESTAMP`
      ).run(
        reminders.enabled ? 1 : 0,
        reminders.timezone?.trim() || "America/Denver",
        reminders.cadence?.trim() || "daily",
        reminders.preferredWindowLabel?.trim() || "",
        reminders.preferredTimeLocal?.trim() || "",
        JSON.stringify(reminders.daysOfWeek || []),
        reminders.tone?.trim() || "supportive",
        reminders.channel?.trim() || "in-app"
      );
    }

    return getDashboardData();
  });
}

export function logCheckIn({
  eventDate,
  energyLevel,
  sleepHours,
  mood,
  soreness,
  workoutStatus,
  nutritionStatus,
  summary,
  workoutLabel,
  workoutTime,
  checkInStatus,
  readinessScore,
  proteinGrams,
  proteinTargetGrams,
  streakDays,
  coachPrompt
}) {
  return withDb((db) => {
    const normalizedDate = eventDate?.trim() || new Date().toISOString().slice(0, 10);

    db.prepare(
      `INSERT INTO check_in_events (
         event_date,
         energy_level,
         sleep_hours,
         mood,
         soreness,
         workout_status,
         nutrition_status,
         summary,
         created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      normalizedDate,
      Number.isFinite(energyLevel) ? energyLevel : null,
      Number.isFinite(sleepHours) ? sleepHours : null,
      mood?.trim() || "",
      soreness?.trim() || "",
      workoutStatus?.trim() || "",
      nutritionStatus?.trim() || "",
      summary?.trim() || ""
    );

    db.prepare(
      `INSERT INTO daily_snapshots (
         snapshot_date,
         workout_label,
         workout_time,
         check_in_status,
         readiness_score,
         protein_grams,
         protein_target_grams,
         streak_days,
         coach_prompt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(snapshot_date) DO UPDATE SET
         workout_label = excluded.workout_label,
         workout_time = excluded.workout_time,
         check_in_status = excluded.check_in_status,
         readiness_score = excluded.readiness_score,
         protein_grams = excluded.protein_grams,
         protein_target_grams = excluded.protein_target_grams,
         streak_days = excluded.streak_days,
         coach_prompt = excluded.coach_prompt`
    ).run(
      normalizedDate,
      workoutLabel?.trim() || "Workout not set",
      workoutTime?.trim() || "TBD",
      checkInStatus?.trim() || "open",
      Number.isFinite(readinessScore) ? readinessScore : 0,
      Number.isFinite(proteinGrams) ? proteinGrams : 0,
      Number.isFinite(proteinTargetGrams) ? proteinTargetGrams : 0,
      Number.isFinite(streakDays) ? streakDays : 0,
      coachPrompt?.trim() || ""
    );

    return getDashboardData();
  });
}
