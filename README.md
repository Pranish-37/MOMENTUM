---
title: "Momentum — From Email to Done"
output: github_document
---

<!-- Badges (optional; replace later)
status: MVP • Platform: Chrome (Gmail-only) • License: MIT/Apache (TBD)
-->

# Momentum

**One-liner:** Turn any Gmail thread into scheduled outcomes — prep time-blocks, Google Tasks (I-Owe / Waiting-On), and ready-to-send drafts — with nudges and re-planning until it’s done.

**Tagline:** *From email to done.*

**Why it exists:** People don’t miss meetings; they miss the **prep** and the **vague asks** hidden in email. Momentum converts ambiguity into a concrete plan and follows through.

---

## What Momentum is (scope you can trust)

- **Gmail-only, on-demand** assistant: activates on the **current thread**.
- Creates **Busy prep block(s)** *before* a deadline in Google Calendar.
- Adds a **Google Task** to the right list (I-Owe or Waiting-On), with subtasks for checklists.
- Prepares a **Gmail draft** (confirm / propose slots / bump). **Never auto-sends.**
- Sets **nudges** (e.g., T−24h, T−2h) and **re-plans** when things change.
- Uses **Google Tasks/Calendar as the app**—no new task UI to learn.

> Momentum is agentic: *perceive → plan → act → monitor → re-plan* — not another summarizer.

---

## MVP Features (hackathon scope)

### 1) Plan This (I-Owe)
- Extracts an explicit ask addressed to you.
- Converts “EOD / tomorrow / next week / by Fri 16:00” into an **exact local timestamp**.
- Creates **1–2 Busy prep blocks** before the deadline.
- Creates a **Task** in “Momentum — I Owe” (+ optional subtasks/checklist).
- Generates a **confirmation draft** (“Confirming Fri 16:00 EEST — blocking time now.”).
- Nudges at **T−24h** and **T−2h**; offers **Re-plan** on snooze/conflict.

### 2) Meet-Me (propose slots)
- Detects meeting intent in the thread.
- Proposes **3 candidate slots** from your Free/Busy (next 3 biz days, avoid lunch, 30–45 min, respect work hours).
- Inserts slots into a **reply draft**; places **tentative holds**; **auto-clears** extra holds when a real invite is confirmed.

### 3) Waiting-On (bump)
- When **they** owe you, creates a task in “Momentum — Waiting On” due in *N* days.
- Prepares a **polite bump draft** tied to the thread.
- At due time, opens the bump draft (no auto-send).

---

## Non-Goals (v1)

- No inbox-wide auto-scans; **current thread only**.
- No sending emails; **drafts-only**.
- No Slack/Jira/Notion integrations.
- No Drive scanning or attachment handling.
- No “summarize every thread” noise.

---

## Why Momentum is different

| Dimension | Typical “AI email” | **Momentum** |
|---|---|---|
| Object of work | Events, drafts, summaries | **Commitments** (I-Owe / Waiting-On) |
| Time semantics | Start/end time | **Deadlines + prep time** before deadline |
| Outcome | CRUD + prose | **Plan → act → follow-through → re-plan** |
| Autonomy | One-shot generation | **Agent loop** across Calendar, Tasks, Drafts |
| Trust posture | Broad permissions, passive | **Gmail-only, on-demand, drafts-only, parse shown** |

---

## User Experience (Chrome extension, Gmail-only)

- **Trigger:** Hotkey (Cmd/Ctrl+Shift+K) or a small “Momentum” button in Gmail thread view.
- **Side panel sections:**
  1. **Parse & Edit:** type chip (I-Owe / Waiting-On), editable title, exact deadline, “view source” snippet.
  2. **Actions:** **Plan This (45m)** · **Propose 3 Slots** · **Draft Bump**.
  3. **Checklist & Outputs:** checklist chips → subtasks; toggles (Prep block / Task / Draft); after action, quick links to created Calendar block(s), Task, Draft. Footer: *Snooze 30m* · *Re-plan* · *Mark done*.
- **Options page (tiny):** Work hours, quiet hours, nudge timings + read-only “Today / Overdue” pulled from the two Google Tasks lists.

---

## Integrations & Permissions (minimal, safe)

- **Host:** `mail.google.com/*` only (extension runs on Gmail).
- **APIs & scopes (principle of least privilege):**
  - Gmail: read-only + compose (for **drafts**).
  - Calendar: read/write (create **Busy prep blocks**, tentative holds).
  - Tasks: read/write (two lists: **Momentum — I Owe**, **Momentum — Waiting On**).
- **Data handling:** Stores only metadata (IDs, timestamps, reasons). Does **not** store email bodies long-term. Shows the parse before acting.

---

## Acceptance Criteria (done = demo-worthy)

- Converts vague deadlines to **exact timestamps** in Europe/Helsinki and adds a confirmation line to drafts.
- Creates **prep block(s)**, **Task**, and **Draft** in under ~2 seconds after “Plan This”.
- Proposes **3 valid slots** and manages **holds** correctly (place & auto-clear).
- Waiting-On bump fires exactly at due time and opens the prepared draft.
- False-positive rate for commitment extraction **< 10%** on typical work mail.
- No auto-send, no inbox-wide scanning, no cross-site permissions.

---

## Demo Script (90 seconds)

1. **Banker docs**: Hit *Plan This* → two prep blocks, task with subtasks, confirmation draft; move a block → *Re-plan* adjusts schedule.
2. **Let’s meet**: *Propose 3 Slots* → draft with options + holds placed; final invite arrives → extra holds auto-clear.
3. **Waiting-On**: Their promise → task due in 3 days + bump draft; at due time, notification opens draft.

---

## Metrics to display

- **On-time completion %** for I-Owe tasks.
- **False-positive %** on extraction.
- **Action latency** (plan → calendar/task).
- **Auto-cleared holds** rate.

---

## Setup & Run (high-level, no code)

1. Create a Google Cloud project; enable **Gmail**, **Calendar**, **Tasks** APIs.  
2. Configure OAuth consent for the minimal scopes above.  
3. Install the Chrome extension; first-run flow creates two Tasks lists:  
   - *Momentum — I Owe*  
   - *Momentum — Waiting On*  
4. Open a Gmail thread → press the hotkey → confirm the parse → run an action.

> Momentum never sends emails; it prepares drafts and shows you everything before acting.

---

## Privacy & Security

- **On-demand only** (current thread).  
- **Drafts-only**; you send.  
- **Gmail-only** host permission; no cross-site reading.  
- **Minimal retention** of metadata; link to Google’s “connected apps” to revoke.

---

## Roadmap (post-MVP)

- Better deadline understanding for multi-timezone threads.  
- Lightweight dashboard for history & metrics (read-only).  
- Team policies (shared work/quiet hours, bump cadences).  
- Optional Slack/Telegram nudges (opt-in, not default).

---

## Attribution & License

- Not affiliated with Google.  
- License: **TBD** (MIT/Apache recommended for hackathon; confirm before release).  
- Contributions welcome once MVP is stable and guardrails are documented.

