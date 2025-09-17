---
title: "Momentum"
subtitle: "From email to done"
author: "Product Vision Document"
date: "`r Sys.Date()`"
output:
  html_document:
    theme: flatly
    toc: true
    toc_float: true
    toc_depth: 3
    number_sections: true
---

```{r setup, include=FALSE}
knitr::opts_chunk$set(echo = TRUE, warning = FALSE, message = FALSE)
```

# Momentum — The Core

## One-Liner

**Turn any Gmail thread into a scheduled outcome: prep time-blocks, tasks, and ready-to-send drafts—with follow-through and re-planning.**

## Tagline

> **From email to done.**

## Target Audience

**Who it's for (now):** Busy students/consultants/founders who use Gmail + Google Calendar and routinely miss implicit asks in email.

---

# MVP Scope (What It Does)

> **Ship these three flows only. Anything else is scope creep.**

## Plan This (I-Owe) {.tabset}

Convert an ask in the open thread into:

- **An exact local deadline** (no "EOD"—always materialize to a timestamp)
- **1–2 Busy prep blocks** before the deadline on Google Calendar
- **A Google Task** in "Momentum — I Owe" (+ optional subtasks/checklist)
- **A Gmail draft** confirming the deadline (never auto-send)
- **Nudges:** T−24h and T−2h; re-plan if you snooze/move blocks

## Meet-Me (Propose Slots) {.tabset}

When a thread implies "let's meet":

- **Compute 3 candidate slots** from your Free/Busy (next 3 biz days, avoid lunch, respect work hours)
- **Insert the slots** into a reply draft and place tentative holds on your calendar
- **Auto-clear holds** when a real invite lands or you confirm a time

## Waiting-On (Bump) {.tabset}

When they owe you:

- **Create a task** in "Momentum — Waiting On" due in N days
- **Prewrite a polite bump draft** linked to the thread
- **At due time,** open the draft to send (no auto-send)

### The Wedge

**commitments → plan → follow-through**

> No summaries, no mass automation, no Drive spelunking.

---

# Non-Goals (Explicitly Out in v1)

```{r non-goals, echo=FALSE}
non_goals <- data.frame(
  "Feature" = c(
    "Inbox-wide auto-scan",
    "Sending emails",
    "Custom task UI",
    "Slack/Jira/Notion integrations",
    "General screen reading"
  ),
  "Constraint" = c(
    "On-demand current thread only",
    "Drafts only",
    "Tiny 'Today/Overdue' panel (Tasks is your DB/UI)",
    "Gmail-native focus",
    "Commitment-specific parsing"
  )
)

knitr::kable(non_goals, caption = "V1 Constraints")
```

---

# Why Momentum is Unique

_vs Gmail/Gemini, Superhuman, Shortwave, Reclaim/Motion_

| **Dimension**      | **Momentum Approach**                                           |
| ------------------ | --------------------------------------------------------------- |
| **Object of work** | Commitments (I-Owe / Waiting-On), not just events or drafts     |
| **Time semantics** | Deadlines + prep time, not merely start/end                     |
| **Follow-through** | Nudges + re-planning when reality changes                       |
| **Trust posture**  | Gmail-only, on-demand, drafts-only, parse shown before acting   |
| **Tool leverage**  | Uses Google Tasks/Calendar as the "app," no brittle todo system |

---

# Extension UX (What Users Actually Touch)

## Surface & Trigger

- **Surface:** Gmail thread view only
- **Trigger:** Hotkey (`Cmd/Ctrl+Shift+K`) or small "Momentum" button on message view

## Side Panel (Three Sections)

### 1. Parse & Edit

- **Type chip:** I-Owe / Waiting-On
- **Title** (editable)
- **Deadline** (always a concrete local timestamp)
- **Confidence** + "view source" (scrolls to the exact sentence)

### 2. Actions

- Plan This (45m)
- Propose 3 Slots
- Draft Bump (visible for Waiting-On)

### 3. Checklist & Outputs

- **Checklist chips** → become subtasks
- **Toggles** (default on): Prep block · Task · Draft
- **After action:** links to created Calendar block(s), Task, Draft
- **Footer:** Snooze 30m · Re-plan · Mark done

## Options Page

_(Tiny, not a new app)_

- **Settings:** work hours, quiet hours, nudge timings
- **Read-only glance:** Today + Overdue pulled from your two Google Tasks lists

---

# Required Integrations & Scopes

> **Minimal, safe**

```{r integrations, echo=FALSE}
integrations <- data.frame(
  "Service" = c("Gmail", "Calendar", "Tasks", "Auth"),
  "Permissions" = c(
    "read-only + compose (for drafts)",
    "read/write (create Busy prep blocks, holds)",
    "read/write (two lists: Momentum — I Owe, Momentum — Waiting On)",
    "per-user OAuth; store tokens securely; request only these scopes"
  )
)

knitr::kable(integrations, caption = "Integration Requirements")
```

---

# Acceptance Criteria (What "Done" Looks Like)

1. **Parses an explicit ask** with you on To: and produces a correct deadline timestamp (no vague terms left)
2. **Creates prep block(s)** within <2s, Task with checklist, and a Draft confirmation—all linked to the thread
3. **"Meet-Me"** proposes three valid slots and places/removes holds correctly
4. **"Waiting-On"** creates a due task + bump draft and surfaces a nudge exactly at due time
5. **False-positive rate** on commitment extraction <10% for typical work mail
6. **No auto-send,** no inbox scanning, no cross-site permissions

---

# Why It's Agentic (And Not a Rules Toy)

```{r agentic-flow, echo=FALSE}
agentic_steps <- data.frame(
  "Step" = c("Perceive", "Plan", "Act", "Monitor", "Re-plan"),
  "Function" = c(
    "Extract asks/promises, deadlines, ICS, participants from the open thread",
    "Choose actions under constraints (work/quiet hours, calendar conflicts)",
    "Create time blocks, tasks, and drafts across Google tools",
    "Watch for snoozes, moved events, new replies",
    "Adjust blocks/bumps and explain why"
  )
)

knitr::kable(agentic_steps, caption = "Agentic Workflow")
```

---

# Kickoff Plan

> **No code, just the sequence to start**

## Name & Promise

**Momentum — from email to done.** Turn any Gmail thread into prep blocks, tasks, and drafts—then follow through.

## MVP Configuration Defaults

- **Work hours:** 09:00–17:30
- **Quiet hours:** 21:00–08:00
- **Prep time default:** 45 min (split into 2 × 25 min if needed)
- **Waiting-On bump:** after 3 days

## Implementation Steps

1. **Define the three flows' UI and copy** (the exact button labels above)
2. **Create your two Google Tasks lists** on first run; store their IDs
3. **Extraction rules first, LLM second:** commit to specific phrases you'll parse (EOD/EOW/by Friday/within 48h). Always materialize to Helsinki time
4. **Plan/placement policy:** pick greedy rules for block placement and 3-slot proposal. Write them down (so you don't waffle later)
5. **Trust & privacy policy page:** on-demand only, drafts-only, metadata only, how to revoke access. Put this in the extension's first-run screen
6. **Demo storyboard:** banker docs email → Plan This; "let's meet" email → Propose 3 Slots; a promise from the other side → Waiting-On bump

---

# End-of-Week Deliverable

> **What judges will see**

## Chrome Extension

Chrome extension that works on **mail.google.com only,** with the side panel and the three flows.

## 90-Second Video Demo

1. Banker email → Plan This creates prep blocks, Task, Draft
2. "Let's meet" email → Propose 3 Slots + holds; show holds auto-clearing on invite
3. "I'll send the portal link tomorrow" → Waiting-On bump created; nudge fires; open bump draft

## Metrics Overlay

Mini metrics overlay: **on-time %**, **false-positive %**, **action latency**

## Documentation

**README:** problem → product → guardrails → how Momentum is different

---

# Why It's Useful (In One Breath)

> **Because people don't miss meetings—they miss the prep and the vague asks.**
>
> Momentum is the only Gmail-native, on-demand tool that turns ambiguity into a scheduled plan with built-in follow-through—and it won't creep on your whole inbox.

---

# Scope Discipline

```{r scope-warning, echo=FALSE}
# Create a warning box effect with kable
scope_warning <- data.frame(
  "⚠️ SCOPE DISCIPLINE" = "Now stick to this scope. If you wander into summaries, Drive search, or 'reads all emails,' you'll dilute the one thing that makes Momentum worth installing."
)

knitr::kable(scope_warning, caption = "Critical Reminder",
             col.names = c(""))
```
