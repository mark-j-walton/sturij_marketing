# Working rules for AI sessions on `sturij_marketing`

Owner: Mark. These rules are **binding for every Claude/AI session** on this repo. If a
request conflicts with them, **stop and ask Mark.** They are scar tissue carried over from
the main Sturij platform (agents that hallucinated "done" work, parallel sessions that
collided, a repo left a mess) **plus** rules specific to marketing, where the failure mode
isn't a bad merge — it's **getting Polly banned from a group she spent years building
trust in.** Treat them as scar tissue, not suggestions.

## The golden rules (do not break)

1. **The tool DRAFTS. A human always SENDS. Never post or message autonomously.**
   No posting to a Facebook group, no sending a DM, no publishing *anything* to the outside
   world without Polly (a human) reading it and pressing send herself. The flow is always
   **propose → human approves → send.** An AI that posts on its own can lose a key group to
   one bad moderator — that is catastrophic and irreversible. When in doubt, draft and hand
   it over; never act.

2. **The Group Ledger is law — respect every group's rules before you draft.**
   Each group has its own temperature (friendly → trigger-happy) and promo rules. Check them
   *before* drafting for that group. The "things to avoid" list is binding: **no adverts, no
   links, no price-first, no copy-paste across groups, no tagging our own page, no arguing in
   public.** If a group's rules are unknown or a moderator runs a competing business, **flag
   the risk and ask — do not risk the relationship to save a step.**

3. **Draft in Polly's voice, or say nothing.**
   Replies are learned from Polly's real, verbatim messages. A roboty or off-voice reply
   blows her cover and is the fastest way to get flagged. Voice-true isn't a nicety — it's a
   safety feature. If you can't draft in her voice, hand it to her blank rather than fake it.

4. **The design system is canonical — never invent a look.**
   Match `STURIJ_DESIGN.md` (DM Serif Display · DM Sans · IBM Plex Mono · warm paper/navy/
   gold) and use `polly_debrief_form.html` as the **reference implementation** — copy its
   structure and CSS-variable usage. **Tokens only; never hardcode a font or colour, never
   reach for a different theme.** (The main platform lost a day to exactly this drift — a
   fresh session inventing its own fonts. Don't repeat it.)

5. **Confidential — nothing leaves the family.**
   Discovery answers, the "dirty truth", near-misses, lead sources, and Polly's message
   samples are sensitive business intelligence. Never share them outside this project, never
   publish them, never feed them to a public/third-party tool. This data is the moat; protect
   it like one.

6. **Trust code and data, not prose.**
   Never act on a chat summary or "handoff" as if it were fact. Verify every claim against the
   actual files, the repo history, and the real data. Previous sessions on the sister project
   hallucinated "done" work that was never built.

7. **Git discipline (carried straight over from the main repo):**
   - **One chat = one branch**, named after the chat, off latest `main`. Do all work there.
   - **Never push or merge to `main` on your own initiative** — your job ends at "pushed to my
     own branch." A human merges.
   - **Never force-push, `reset --hard`, or delete a shared branch.** No history rewriting
     except restarting your *own* fresh branch.
   - **Verify before you claim.** Never say "done / committed / pushed" without proving it:
     local `HEAD` must equal the remote. If a push fails, say so plainly — don't report success.
   - **One session at a time.** Do not run parallel sessions against this repo; they collide.
   - **No autonomous / scheduled pushes.**

8. **Secrets never touch chat or the repo.**
   Facebook / Messenger tokens, API keys, passwords live only in env / platform config —
   never in the repo, a commit, the client, or chat. If a secret appears in chat, say so
   immediately and treat it as compromised — it must be revoked.

## Start every session by re-grounding

The context of a long or resumed chat drifts from reality. Before building anything, verify:
- Note the real `main` HEAD; branch off *that*.
- Confirm the working tree/branch state and that `local == remote` for what you touch.
- Spot-check any "fact" you're about to rely on against the files/data, not memory.

## What this platform is (so you build the right thing)

A marketing platform for Sturij's Facebook-group presence. It **captures how the marketing
really works** (the discovery/debrief) and turns it into: a **Group Ledger** (rules + risk
per group), a **survival playbook**, and a **reply tool that drafts in Polly's voice**. The
job is to make Polly **safer and faster while she stays fully in control** — never to
replace her judgement or act in her name.

## How it relates to the main Sturij platform

Separate repo, its own soft skin *for now* — but it shares two things deliberately, so the
two can converge later:
- the **design DNA** (`STURIJ_DESIGN.md`), and
- the **automation engine** — *propose → human approves → send* (the same grammar the app's
  chat runs on). Keep to both and "bring it across if it works well" is a merge, not a rebuild.

## If you are blocked

Anything ambiguous or irreversible — especially anything that would post, message, or touch a
real group — **stop and ask Mark.** A recommendation with one clear question beats a confident
guess. GitHub writes returning 403 = policy; report it, don't retry.
