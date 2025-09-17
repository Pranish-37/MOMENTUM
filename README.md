## Momentum — the core

One-liner: Turn any Gmail thread into a scheduled outcome: prep time-blocks, tasks, and ready-to-send drafts—with follow-through and re-planning.

### From email to done.

Who it’s for (now): Busy students/consultants/founders who use Gmail + Google Calendar and routinely miss implicit asks in email.

MVP scope (what it does)

Ship these three flows only. Anything else is scope creep.

Plan This (I-Owe)
Convert an ask in the open thread into:

An exact local deadline (no “EOD”—always materialize to a timestamp).

1–2 Busy prep blocks before the deadline on Google Calendar.

A Google Task in “Momentum — I Owe” (+ optional subtasks/checklist).

A Gmail draft confirming the deadline (never auto-send).

Nudges: T−24h and T−2h; re-plan if you snooze/move blocks.

Meet-Me (propose slots)
When a thread implies “let’s meet”:

Compute 3 candidate slots from your Free/Busy (next 3 biz days, avoid lunch, respect work hours).

Insert the slots into a reply draft and place tentative holds on your calendar.

Auto-clear holds when a real invite lands or you confirm a time.

Waiting-On (bump)
When they owe you:

Create a task in “Momentum — Waiting On” due in N days.

Prewrite a polite bump draft linked to the thread.

At due time, open the draft to send (no auto-send).

That’s the wedge: commitments → plan → follow-through. No summaries, no mass automation, no Drive spelunking.

Non-goals (explicitly out in v1)

No inbox-wide auto-scan. On-demand current thread only.

No sending emails. Drafts only.

No custom task UI beyond a tiny “Today/Overdue” panel (Tasks is your DB/UI).

No Slack/Jira/Notion integrations.

No “general screen reading.”

Why Momentum is unique (vs Gmail/Gemini, Superhuman, Shortwave, Reclaim/Motion)

Object of work: commitments (I-Owe / Waiting-On), not just events or drafts.

Time semantics: deadlines + prep time, not merely start/end.

Follow-through: nudges + re-planning when reality changes.

Trust posture: Gmail-only, on-demand, drafts-only, parse shown before acting.

Leverage existing tools: uses Google Tasks/Calendar as the “app,” so you don’t invent a brittle todo system.

Extension UX (what users actually touch)

Surface: Gmail thread view only.

Trigger: hotkey (Cmd/Ctrl+Shift+K) or a small “Momentum” button that appears on message view.

Side panel (three sections):

Parse & Edit

Type chip: I-Owe / Waiting-On

Title (editable)

Deadline (always a concrete local timestamp)

Confidence + “view source” (scrolls to the exact sentence)

Actions

Plan This (45m)

Propose 3 Slots

Draft Bump (visible for Waiting-On)

Checklist & Outputs

Checklist chips → become subtasks

Toggles (default on): Prep block · Task · Draft

After action: links to created Calendar block(s), Task, Draft

Footer: Snooze 30m · Re-plan · Mark done

Options page (tiny, not a new app):

Settings: work hours, quiet hours, nudge timings.

Read-only glance: Today + Overdue pulled from your two Google Tasks lists.

Required integrations & scopes (minimal, safe)

Gmail: read-only + compose (for drafts).

Calendar: read/write (create Busy prep blocks, holds).

Tasks: read/write (two lists: Momentum — I Owe, Momentum — Waiting On).

Auth: per-user OAuth; store tokens securely; request only these scopes.

Acceptance criteria (what “done” looks like)

Parses an explicit ask with you on To: and produces a correct deadline timestamp (no vague terms left).

Creates prep block(s) within <2s, Task with checklist, and a Draft confirmation—all linked to the thread.

“Meet-Me” proposes three valid slots and places/removes holds correctly.

“Waiting-On” creates a due task + bump draft and surfaces a nudge exactly at due time.

False-positive rate on commitment extraction <10% for typical work mail.

No auto-send, no inbox scanning, no cross-site permissions.

Why it’s agentic (and not a rules toy)

Perceive: extract asks/promises, deadlines, ICS, participants from the open thread.

Plan: choose actions under constraints (work/quiet hours, calendar conflicts).

Act: create time blocks, tasks, and drafts across Google tools.

Monitor: watch for snoozes, moved events, new replies.

Re-plan: adjust blocks/bumps and explain why.

Kickoff plan (no code, just the sequence to start)

Name & promise (README top):
Momentum — from email to done. Turn any Gmail thread into prep blocks, tasks, and drafts—then follow through.

Decide the MVP knobs (defaults):

Work hours 09:00–17:30; quiet hours 21:00–08:00.

Prep time default 45 min (split into 2 × 25 min if needed).

Waiting-On bump after 3 days.

Define the three flows’ UI and copy (the exact button labels above).

Create your two Google Tasks lists on first run; store their IDs.

Extraction rules first, LLM second: commit to specific phrases you’ll parse (EOD/EOW/by Friday/within 48h). Always materialize to Helsinki time.

Plan/placement policy: pick greedy rules for block placement and 3-slot proposal. Write them down (so you don’t waffle later).

Trust & privacy policy page: on-demand only, drafts-only, metadata only, how to revoke access. Put this in the extension’s first-run screen.

Demo storyboard: banker docs email → Plan This; “let’s meet” email → Propose 3 Slots; a promise from the other side → Waiting-On bump.

End-of-week deliverable (what judges will see)

Chrome extension that works on mail.google.com only, with the side panel and the three flows.

90-sec video:

Banker email → Plan This creates prep blocks, Task, Draft.

“Let’s meet” email → Propose 3 Slots + holds; show holds auto-clearing on invite.

“I’ll send the portal link tomorrow” → Waiting-On bump created; nudge fires; open bump draft.

Mini metrics overlay: on-time %, false-positive %, action latency.

README: problem → product → guardrails → how Momentum is different.

Why it’s useful (in one breath)

Because people don’t miss meetings—they miss the prep and the vague asks. Momentum is the only Gmail-native, on-demand tool that turns ambiguity into a scheduled plan with built-in follow-through—and it won’t creep on your whole inbox.

Now stick to this scope. If you wander into summaries, Drive search, or “reads all emails,” you’ll dilute the one thing that makes Momentum worth installing.
