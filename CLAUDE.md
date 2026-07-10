# Working rules for AI sessions on `sturij_marketing`

Owner: Mark. These rules are **binding for every Claude/AI session** on this repo. If a request conflicts with them, **stop and ask Mark.** They are scar tissue carried over from the main Sturij platform (agents that hallucinated "done" work, parallel sessions that collided, a repo left a mess) **plus** rules specific to marketing, where the failure mode isn't a bad merge — it's **getting Polly banned from a group she spent years building trust in.** Treat them as scar tissue, not suggestions.

---

## Why this exists — read this before the rules make sense

Mark has run a digital agency for 25+ years — big brands, real responsibility, at one point 300+ developers. He currently employs 50+ developers and has never written a line of code himself, by choice. He is not chasing a quick win, a silver bullet, or a 10-minutes-to-launch story. He has explicitly rejected that mentality: the "I built an app and now I'm a billionaire" YouTube-generation hype cycle is something he actively distrusts, not something he's chasing. He ran a large agency for decades and did not become a billionaire; he knows exactly how hard real work is, and treats anyone promising otherwise with suspicion.

**The actual problem he's solving:** AI has introduced real uncertainty into the market his agency and its 50+ developers depend on. Rather than treat that as a threat to defend against, he's using it as the reason to genuinely reinvent how the business competes — specifically so his developers keep their jobs. He is not automating people out; he's trying to find a way to compete with large incumbents ("ocean liner software" — powerful, but slow and expensive to redirect) without the licensing budgets or ad spend those incumbents have. He does not have thousands of pounds to spend competing for attention the way big-budget advertisers do. His edge has to come from somewhere else: intelligence, not spend.

**What he believes about AI:** it's a tool to think better and work more productively with — "AI is my friend, not something to fear" — used through exploration and real experimentation, not hype, not shortcuts, and never at the expense of doing right by the people the business touches (Polly, his developers, his customers). He is explicit that automation-for-its-own-sake, chasing engagement numbers, or "money rolls in" thinking is not the goal here — a better service, genuinely delivered, is.

**The actual goal of this repository is not "build an app."** It's finding customers who don't currently know Sturij exists and giving them a real opportunity to consider what Sturij offers — without the ad budget the "ocean liner" competitors have. Every tool built here (the debrief form, the Group Ledger, the eventual reply assistant) exists in service of that, using owned data and genuine insight rather than platform dependency or automation shortcuts.

**On accountability:** Mark is explicit that he is the accountable party for everything produced here — not the AI, not Anthropic. He treats Claude as a consultant whose judgement he is paying for and relying on, which is exactly why accuracy, honesty about real constraints, and never overstating what's possible matter more here than in a typical build. Bullshit is the one thing he has zero tolerance for.

**What this means for any AI working on this repo:** don't just follow the rules below — understand why they exist. They come from someone who has run real teams, seen real hype cycles fail, and is being deliberately careful with something that matters to him and to the people around him. Match that seriousness. Be genuinely useful, not impressive. Say clearly when something can't be done rather than performing progress.

## The four threads (current focus, in priority order)

1. **UX for Polly — the most important one.** The entire justification for this platform is making her job easier and safer. If any tool here adds friction, complexity, or a "software" feeling instead of removing it, it has failed regardless of how technically impressive it is. Every other thread is in service of this one, not equal to it.  
2. **Instrument what already exists.** Turn the Group Ledger, debrief data, and reply outcomes into aggregate insight Mark and Polly couldn't see group-by-group — the unknown-unknowns live in the pattern across groups, not in any single one.  
3. **Find the customer who doesn't know Sturij exists yet.** Research where else (beyond the 325 known groups) people are already asking the questions Sturij answers — parallel communities, not just parallel markets.  
4. **Build the owned-channel bridge.** Get a genuinely interested enquiry off Facebook and into a channel Sturij actually owns (email, phone) as early as is natural — so the relationship doesn't live entirely inside a platform Mark doesn't control and that could change its rules again tomorrow, the way the Groups API did.

---

## The golden rules (do not break)

1. **The tool DRAFTS. A human always SENDS. Never post or message autonomously.** No posting to a Facebook group, no sending a DM, no publishing *anything* to the outside world without Polly (a human) reading it and pressing send herself. The flow is always **propose → human approves → send.** An AI that posts on its own can lose a key group to one bad moderator — that is catastrophic and irreversible. When in doubt, draft and hand it over; never act.  
     
2. **The Group Ledger is law — respect every group's rules before you draft.** Each group has its own temperature (friendly → trigger-happy) and promo rules. Check them *before* drafting for that group. The "things to avoid" list is binding: **no adverts, no links, no price-first, no copy-paste across groups, no tagging our own page, no arguing in public.** If a group's rules are unknown or a moderator runs a competing business, **flag the risk and ask — do not risk the relationship to save a step.**  
     
3. **Draft in Polly's voice, or say nothing.** Replies are learned from Polly's real, verbatim messages. A roboty or off-voice reply blows her cover and is the fastest way to get flagged. Voice-true isn't a nicety — it's a safety feature. If you can't draft in her voice, hand it to her blank rather than fake it.  
     
4. **The design system is canonical — never invent a look.** Match `STURIJ_DESIGN.md` (DM Serif Display · DM Sans · IBM Plex Mono · warm paper/navy/ gold) and use `artifacts/group_ledger.html` as the **reference implementation** — copy its structure and CSS-variable usage. **Tokens only; never hardcode a font or colour, never reach for a different theme.** (The main platform lost a day to exactly this drift — a fresh session inventing its own fonts. Don't repeat it.) *(Updated 10 July 2026: `polly_debrief_form.html` served this role originally, but its discovery purpose is now complete — discovery happened directly in conversation with Mark instead. `group_ledger.html` is the more complete demonstration of the design system in practice and is now the canonical reference.)*  
     
5. **Confidential — nothing leaves the family.** Discovery answers, the "dirty truth", near-misses, lead sources, and Polly's message samples are sensitive business intelligence. Never share them outside this project, never publish them, never feed them to a public/third-party tool. This data is the moat; protect it like one.  
     
6. **Trust code and data, not prose.** Never act on a chat summary or "handoff" as if it were fact. Verify every claim against the actual files, the repo history, and the real data. Previous sessions on the sister project hallucinated "done" work that was never built.  
     
7. **Git discipline (carried straight over from the main repo):**  
     
   - **One chat \= one branch**, named after the chat, off latest `main`. Do all work there.  
   - **Never push or merge to `main` on your own initiative** — your job ends at "pushed to my own branch." A human merges.  
   - **Never force-push, `reset --hard`, or delete a shared branch.** No history rewriting except restarting your *own* fresh branch.  
   - **Verify before you claim.** Never say "done / committed / pushed" without proving it: local `HEAD` must equal the remote. If a push fails, say so plainly — don't report success.  
   - **One session at a time.** Do not run parallel sessions against this repo; they collide.  
   - **No autonomous / scheduled pushes.**

   

8. **Secrets never touch chat or the repo.** Facebook / Messenger tokens, API keys, passwords live only in env / platform config — never in the repo, a commit, the client, or chat. If a secret appears in chat, say so immediately and treat it as compromised — it must be revoked.  
     
9. **A "portable," "template," or "generic" version of this file is never this file.** (Added 10 July 2026, after exactly this happened: a generic governance template — built for reuse in an unrelated project — was mistaken for a real `CLAUDE.md` and overwrote this one, deleting the "Why this exists" section, rules 2–5, and the architect gate in one move.) If you generate, receive, or are handed a project-agnostic version of this constitution — for another repo, as a shareable template, anything with placeholders like `[YOUR NAME]` — **it must never be written to this repo's `CLAUDE.md` without the human explicitly confirming that's the intent, by name, in that session.** Seeing a file shaped like `CLAUDE.md` is not permission to treat it as `CLAUDE.md`. When in doubt, diff it against what's already here and ask before overwriting anything.

## Source of truth & tooling (added 9 July 2026, after a session that found drift)

10. **Git is the only source of truth. Google Drive is scratch space, not storage.** Drive can be used for early drafting — voice notes, rough docs, a conversation with Claude — but the moment something is real, it gets committed to git. A file that only exists in Drive is not "done," no matter how finished it looks. If you find content living in Drive that should be in the repo, that's a bug to fix, not a second home for it.  
      
11. **One artifact, one file, one location. No parallel copies — ever.** If you're about to create a file and something with the same name or same content might already exist (in git or in Drive), check first. Two copies of the same document — even identical ones — is exactly the kind of drift these rules exist to prevent. Found a duplicate? Resolve it immediately: pick the canonical copy, delete or archive the rest, don't leave both live "for now."  
      
12. **Multiple tools can reach this repo — they are independent, and none of them imply the others work.** At different times this project has been accessed via: claude.ai's own GitHub connector, Claude Code's local MCP GitHub server (running in Codespaces/VS Code), and Claude in Chrome browsing github.com directly. These are three separate systems with separate auth. One working — or failing — tells you nothing about the state of the others. Don't assume a fix in one carries over to another; verify the specific tool you're about to use.  
      
13. **If the primary connector is down, browser-based edits are an acceptable fallback — with the same git discipline — but not for large files.** Creating or editing small files through github.com's web UI via Claude in Chrome is fine when the API connector isn't available. It does not relax rule 7: still one branch per session, still no direct commits to `main`, still a human merges. For anything of real size (a full HTML artifact, a long document), browser-based typing/injection is unreliable and risks silent corruption — prefer a session with real filesystem/git access (Claude Code) for those, or have the human upload the file directly rather than have an AI attempt to type it through a web editor.

## Architect review gate (added 9 July 2026\)

14. **A second AI (the "architect") reviews everything before it touches a real group.** Nothing built here — reply drafts, ledger entries, posting behaviour, anything that could reach Facebook — goes live until it has been reviewed by the architect AI and approved by Mark. This is a gate in addition to rule 1 (draft/approve/send), not a replacement for it: rule 1 governs each individual message; this rule governs whether the *system* is trusted to operate near real groups at all. If you're building or changing anything that will eventually touch Facebook (even indirectly — e.g. the reply tool's voice matching, the ledger's rule logic), flag clearly in your output that it is pending architect review and not yet cleared for live use.

## Relationship to the main Sturij app — proving ground, not permanent skin (added 9 July 2026\)

15. **This repo is a fast proving ground. Validated features graduate into the main app's artifact model — they don't stay here forever.** The main platform (`sturij-web`) builds real artifacts: UX JSON \+ Content JSON, tokens-only, showcased and locked in the Design-System specimen, living on the desk canvas. This repo deliberately skips that machinery — plain HTML/CSS/JS, no token system, no build step — so features can be designed and tested quickly, with Polly, before any of that investment is justified. That's a feature of this repo, not a shortcut to feel bad about.  
      
16. **What "graduation-ready" means while building here.** Since a proven feature eventually gets rebuilt properly in the main app, keep each artifact clean enough that the *logic and interaction design* can be lifted even though the *code* won't be reused directly:  
      
    - Keep data model and UI concerns separable in your head, even in plain JS (e.g. the Group Ledger's group object shape is the real spec; the vanilla-JS render functions are throwaway).  
    - Match `STURIJ_DESIGN.md` values exactly (hex codes, spacing, type scale) even without a token system, so the future tokenized version is a faithful port, not a redesign.  
    - Note explicitly in any handoff which interaction patterns proved out (e.g. "review-and- confirm beats a blank form," "dashed border reads as 'act on this'") — that's the actual asset being proven, more than any specific file.

    

17. **Nothing graduates automatically or silently.** A feature moving from this repo into the main app's artifact model is a deliberate decision Mark makes, not something an AI session infers or initiates on its own.

## Scheduling & automation (see also `SKILL.md` — sturij-scheduled-events)

Real scheduled automation exists (Claude Desktop Cowork scheduled tasks, Claude Code cloud tasks) — an earlier version of this file wrongly claimed otherwise. Scheduled tasks are genuinely useful here for read/draft/flag work (stale-rules checks, event digests, learning-log summaries). **Never scope a scheduled task with permission to post, message, or send anything on Facebook or any real group** — a scheduled task runs unattended, which is exactly the situation rule 1 and rule 14 exist to guard against. See `SKILL.md` for the full pattern.

## Start every session by re-grounding

The context of a long or resumed chat drifts from reality. Before building anything, verify:

- Note the real `main` HEAD; branch off *that*.  
- **List ALL branches AND open PRs — not just `main`.** `main` being clear is *not* enough:
  another session's unmerged in-progress branch is a collision waiting to happen. (This exact
  thing happened 10 Jul 2026 — two sessions built parallel, divergent versions of this site
  because one only checked `main`.) If a branch/PR already touches what you're about to build,
  build on it or flag the clash — do not start a second parallel version.
- **One owner per repo, and it's whoever has real tool access here.** Marketing dev lives in
  the session with direct git/DB/deploy tools (Claude Code), not a browser-mediated one — the
  disconnects and hallucinations that caused the collision came from split, tool-poor sessions.
- Confirm the working tree/branch state and that `local == remote` for what you touch.  
- Spot-check any "fact" you're about to rely on against the files/data, not memory.

## What this platform is (so you build the right thing)

A marketing platform for Sturij's Facebook-group presence. It **captures how the marketing really works** (the discovery/debrief) and turns it into: a **Group Ledger** (rules \+ risk per group), a **survival playbook**, and a **reply tool that drafts in Polly's voice**. The job is to make Polly **safer and faster while she stays fully in control** — never to replace her judgement or act in her name.

## How it relates to the main Sturij platform

Separate repo, its own soft skin *for now* — but it shares two things deliberately, so the two can converge later: the **design DNA** (`STURIJ_DESIGN.md`), and the **automation engine** — *propose → human approves → send* (the same grammar the app's chat runs on). Keep to both and "bring it across if it works well" is a merge, not a rebuild. See also the "proving ground" section above for how that graduation actually happens.

## If you are blocked

Anything ambiguous or irreversible — especially anything that would post, message, or touch a real group — **stop and ask Mark.** A recommendation with one clear question beats a confident guess. GitHub writes returning 403 \= policy; report it, don't retry.  
