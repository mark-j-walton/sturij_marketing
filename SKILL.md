---

## name: sturij-scheduled-events description: How to handle posting-day rules and local events for the Sturij Marketing (Polly's Facebook groups) project. Use this whenever adding or editing a group's allowed posting days, capturing a group's official rules that mention specific days/times, or adding a local event Polly could post about. Also use when asked to build any "scheduling" or "reminder" feature for this project — Claude has no background scheduler, so read this first to understand what's actually being asked for.

# Sturij Scheduled Events

Two distinct things live under "scheduled events" in this project. Keep them separate — they're stored separately in the Group Ledger and serve different purposes.

## 1\. Per-group posting windows

Some groups restrict *when* promotional content is allowed — e.g. the real example that prompted this skill: "Business ads approved either on Wednesday or Thursday, not both days." This is a **rule**, and it belongs on the group's card, not in a separate calendar.

**Where it lives:** each group object in the Ledger has:

- `postingDays`: array of day abbreviations (`['Wed','Thu']`) — which days promotional posts are allowed  
- `postingNote`: free text for nuance the day-list alone can't capture (e.g. "ads only, general chat/replies fine anytime")

**When capturing this:** always read it from the group's actual, official Rules tab (see the "Official rules (verbatim)" field on the same card) — never infer posting days from vibes or Polly's general impression of a group. If the official rules don't specify days, leave `postingDays` empty rather than guessing a default.

**What this is *not*:** it is not a trigger that fires an action on those days. Nothing in this repo posts automatically — per `CLAUDE.md` rule 1, the tool drafts, a human sends, always. This field exists so a human (or a future drafting tool) can *check* whether today is a safe day to post in a given group, not so the system can act on it unsupervised.

## 2\. Local events

A separate, group-independent list of things happening locally that could be worth a post — markets, fairs, school events, seasonal moments. These aren't tied to any one group's rules; they're raw material for content ideas.

**Where it lives:** stored separately from groups (`group-ledger:events` storage key), rendered as a simple chronological list: name \+ date, add/remove only. No AI generation of event ideas — Polly or Mark adds what's real and locally relevant.

**Relationship to the Post Composer (once built):** when the Post Composer exists, it should be able to read this list as one input for suggesting post topics — "Harrogate Christmas Market is in 9 days, want a post about it?" — but the event itself is always entered by a human, never invented.

## The critical thing to get right: real scheduling exists now, which raises the stakes

**Correction (10 July 2026):** an earlier version of this skill claimed Claude has no way to run on a schedule. That was wrong. Claude Desktop's Cowork has genuine scheduled tasks — a saved prompt fires automatically on a cadence you set (daily, weekly, weekdays), each run a full session with the same skills, tools, and connectors as any other. There's also a cloud version (Claude Code scheduled tasks) that runs on Anthropic's infrastructure without your machine needing to be on at all. Type `/schedule` in a session, or use the Scheduled Tasks page in Desktop, to set one up.

**This makes the safety point sharper, not weaker.** A scheduled task is a session that runs *without Mark or Polly watching it happen*. That is exactly the situation `CLAUDE.md` rule 1 ("the tool DRAFTS, a human always SENDS") and rule 13 (the architect-review gate) exist for. So:

- **Never scope a scheduled task with permission to post, message, or take any action on Facebook or any real group.** A scheduled task that drafts and *saves* a draft for Polly to review later is fine and genuinely useful. A scheduled task that could send anything unattended is exactly the failure mode this whole project is built to prevent — the fact that nobody's watching in the moment is the danger, not a convenience.  
- Good, safe uses of scheduling for this project: a weekly task that checks which groups' "Official rules (verbatim)" haven't been touched in 90+ days and flags them; a task that pulls upcoming local events into the events list for Mark/Polly to review; a monthly task that reads the learning log and drafts (not sends) a summary of what's working. All of these produce something for a human to read and act on — none of them touch Facebook.  
- If a future request sounds like "make this run automatically," the right first question is: *does this task ever touch a real group or send anything, even indirectly?* If yes, stop and flag it for architect review before scheduling it, per rule 13 — don't schedule it and hope the prompt wording keeps it safe.

## Quick reference

| Need | Field / mechanism | Notes |
| :---- | :---- | :---- |
| A group only allows ads on certain days | `group.postingDays`, `group.postingNote` | Source from official rules, never guess |
| Something local worth posting about | top-level `events` list | Human-entered, chronological, no AI invention |
| "Make this happen automatically on a schedule" | Real: Claude Desktop Cowork scheduled tasks (`/schedule`), or Claude Code cloud tasks | Only ever for read/draft/flag work — never scope a scheduled task to post or send. Anything touching a real group goes through architect review first. |

