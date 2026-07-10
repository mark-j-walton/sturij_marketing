# The Working Model — how AI teams operate on Sturij

The standing operating model for **any** AI pairing on a Sturij project. It exists because
two specific things happened and hurt: a 3-day recovery from a **Fable hallucination** (an AI
believing its own story about the database), and a **two-session collision** (two AIs building
parallel, divergent versions of the same site because they couldn't see each other's work).
Both are the *same* failure — acting on story instead of ground truth. This model makes that
failure structurally impossible. Follow it and neither recurs.

---

## Rule 0 — Equal tools, one ground truth. No disparity.

*(The most important rule. It goes first because violating it is what sprang the trap.)*

- **Both AIs must have equal, full access to the same reality** — the actual git branches and
  open PRs, the live database, the live deploy. Not a summary of them. Them.
- An AI that **can't read ground truth works from prose and assumption** — which is the raw
  material of hallucination. A validator that can't read reality cannot validate. A dev that
  can't read the repo builds blind.
- **If one side is tool-poor** — browser-mediated, MCP-fragile, prone to disconnecting — **do
  not pair them for build work.** Asymmetry *is* the bear trap: two AIs with two different
  views of reality build blind and collide. (This is exactly what happened: a tool-poor
  session and a tool-capable one built the same site twice, on branches neither could see.)
- **Uniformity is the safety feature.** Two identical, fully tool-capable sessions beat one
  capable + one hand-wired every time. Don't bolt fragile machinery (desktop MCP configs)
  onto one side — that *creates* the disparity.

## The three roles

1. **Architect** — plans the sprint, holds the design, and **validates the dev's work against
   reality** (code · DB · deploy), *never* against the dev's account of it. May do small,
   isolated conceptual jobs (sketch a page, spec a schema) **without touching the dev's
   working tree** — planning that doesn't disturb building.
2. **Dev** — builds. **One dev, one repo, one lane (one branch).** Re-grounds before starting:
   lists **all** branches *and* open PRs, not just `main`.
3. **Human** — the **only** one who merges. Nothing reaches `main` without the person.

## The non-negotiables

- **Validate against reality, not prose.** Every "done / pushed / it works" is checked against
  the actual rows, the actual branch, the actual deploy. This is the anti-hallucination gate —
  the thing that turns a 3-day scare into a 3-query answer.
- **One owner per repo.** Two builders in one repo = collision. If the architect must build, it
  *becomes* the dev for that lane and the other stays out. Roles don't overlap in a repo.
- **Re-ground before building.** `main` being clean is **not enough** — another session's
  unmerged branch is a collision waiting to happen. List branches + PRs first, every time.
- **Human merges; agents propose.** Propose → architect validates → human approves. Prefer
  append-only / reversible changes so "undo that" is always safe.

## Why it works (the mechanism)

A single 1:1 AI has to hold *planning + building + checking* in one context at once — it marks
its own homework while still writing it, which bloats context and breeds drift. Splitting the
roles gives each a smaller, cleaner context, and — crucially — lets the **architect check the
dev's output against the same ground truth the dev wrote to.** Hallucination cannot survive
contact with a validator that reads reality. Clean lanes stop the jumping-around and the
collisions. The human gate stops anything wrong from shipping.

## In one line

> **Two equally-equipped AIs, in separate lanes, both reading the same reality: one architects
> and validates, one builds, the human merges. No disparity, no prose-trust, no jumping around.**
