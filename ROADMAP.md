# Sturij Marketing — Roadmap

Living document. Update by hand when status changes materially — same discipline as
`CLAUDE.md` rule 6: trust what's actually true, not what was true last time someone wrote it
down. Last updated: 21 July 2026 (next-revision sprints 0–5 built on `develop`/staging — see CHANGELOG 'Unreleased').

Organised by how real each thing is, not by how exciting it is. "Done" means verified, not
claimed.

---

## Where things actually stand right now

| Area | Status |
|---|---|
| Group gathering from Facebook | **Complete** — 272 real groups, five clean batches, zero duplicates |
| Groups with real URLs confirmed | 29 of 272 (1 direct link + 28 via search, all verified) |
| Groups with full official rules captured | 2 of 272 (Wetherby Grumbler, Boston Spa Grumbler) |
| Group Ledger tool | Built, working, tested — title-casing, tags, tone slider, image picker, posting-day rules, batch area-research all live |
| Database (Supabase) | **Live** — prod (`xscvfzfeepiakudshtod`) + isolated staging (`srezefvaahdiiczakadx`); schema consolidated in `supabase/migrations/` |
| Reply Drafter | **Not built** — blocked on Polly's real verbatim replies |
| Post Composer | Concept only, discussed in chat, not specced formally |
| `CLAUDE.md` / governance | Compiled and correct in this session's working copy; a separate accidental overwrite happened in the repo (portable template mistake) — **restore not yet independently confirmed** |
| Claude in Chrome (browser access) | Currently disconnected, transient — plan exists for when it's back (28 confirmed URLs ready to work through live) |
| Strategy docs (Drive → git) | Still in Google Drive, **not migrated** — a known, named gap per `CLAUDE.md` rule 9 |

---

## Track 1 — Immediate, low-effort, high-leverage

These don't need new building, just doing.

1. **Confirm the `CLAUDE.md` restore actually landed in the repo.** Everything downstream
   assumes the real constitution is in place, not the generic portable template. This is a
   verify-don't-assume item, not a build item.
2. **Collect 10–20 of Polly's real, verbatim replies.** The single highest-leverage thing
   outstanding — it's the one thing blocking the Reply Drafter, and the Reply Drafter is
   arguably the actual point of this whole repo (per `CLAUDE.md`'s "why this exists"). Nothing
   else on this roadmap matters as much as this one.
3. **Continue official-rules capture, one group at a time.** Screenshots or (once reconnected)
   live browsing. Currently 2 of 272 — realistically this stays a slow-and-steady background
   task, not a sprint.
4. **Decide when to run "Research all unresearched groups" at real scale.** The batch tool is
   built and tested; running it against all 272 is a real cost (API calls, time), so this is a
   deliberate go/no-go, not an automatic next step.
5. **Resume the 28-URL live-browsing plan once Claude in Chrome reconnects.** One at a time,
   attended, reading the real page instead of a screenshot — plan is set, just waiting on the
   tool.

## Track 2 — Real build work, medium-term

Needs actual engineering time, best done in Claude Code per the architect/builder split already
established.

1. **Database migration.** Implement `GROUP_LEDGER_SCHEMA.md` in Supabase (not a new system —
   the same project the main app already uses). Swap the Ledger's `window.storage` calls for
   real queries, keep every UI pattern exactly as proven. Deploy to Vercel. This is what makes
   the tool something Polly can open on her own, independent of a Claude session — the actual
   trigger for this work, not "it'd be nice to have a real database."
2. **Build the Reply Drafter**, once Polly's voice samples exist. Draft in her voice, show the
   "why this is safe" line against the group's actual official rules, copy-to-clipboard only —
   never a send button, per rule 1.
3. **Migrate `strategy_framework/` from Drive into git.** Named gap, not urgent, but shouldn't
   sit open indefinitely — Drive is scratch space, not storage, per rule 10.

## Track 3 — Parked concepts, not yet scoped for real

Real ideas, deliberately not started — starting them now would be exactly the kind of
premature infrastructure investment the proving-ground principle (rule 15) warns against.

1. **Post Composer.** Sibling to the Reply Drafter — three genuinely different angles for a new
   post (not three rewordings), remix, a comment box to steer, outcomes logged. Same
   propose-never-send grammar as the Reply Drafter. Worth building once the Reply Drafter has
   actually proven the pattern with Polly, not before.
2. **Photo-based imagery tied to the tone slider.** Discussed early — real project photos
   selected by register (polished vs down-to-earth) and household context, matching the group's
   demographic read. Needs a real, taggable photo library first; currently a design principle,
   not a feature.
3. **Graduation into the main Sturij app's artifact model.** Per rules 15–17: once something
   here is genuinely proven with Polly, it can be rebuilt properly with tokens, on the desk
   canvas, in the Design-System specimen. Deliberate, human-decided, never automatic.
4. **Safe scheduled tasks** (Cowork), per `SKILL.md` — e.g. a weekly stale-rules check, a
   monthly learning-log summary. Read/flag/draft only, never scoped to send or post. Genuinely
   available now (Cowork scheduled tasks are real), just not built — low priority until there's
   enough real data (official rules, responses) for a scheduled summary to say anything useful.

---

## What this roadmap deliberately doesn't include

No dates, no sprint numbers, no "Q3 delivery" language. This repo doesn't have the main app's
heavier process (no `verify.mjs`, no `/approve-sprint`), and pretending otherwise here would be
the same mistake the governance page corrected earlier — borrowing machinery that doesn't
actually exist. Progress gets marked here when it's real, not scheduled here in advance.
