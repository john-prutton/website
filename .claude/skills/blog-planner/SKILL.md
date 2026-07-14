---
name: blog-planner
description: Use this skill when the user asks to plan a blog post, write an article, or organize written content.
---

# Blog Post Skill

Use this skill when the user asks you to write, draft, or edit a blog post for this site.

## Frontmatter

Every post uses this format:

```markdown
---
title: "Post Title Here"
blurp: One-line summary of the post
pubDate: YYYY-MM-DD
tags: ["tag1", "tag2"]
---
```

Valid tags: `tech`, `project`. Use only what fits.

## Voice and style

- Write in first person, casual but clear.
- Short sentences. Direct. No filler.
- No em dashes (—). Restructure the sentence, use a comma, or use a period instead.
- No exclamation points unless quoting something.
- Avoid adverbs and hedging ("basically", "essentially", "kind of").
- Contractions are fine.
- British or American spelling is fine; just be consistent within a post.

## Structure

- Lead with the problem or context — no preamble.
- Use `##` headings to break up longer posts. Short posts can skip headings entirely.
- Bullet lists are fine for enumerating things, but don't force prose into lists.
- Keep posts focused. One idea per post. End when the point is made.

## Code snippets

- Use fenced code blocks with a language tag.
- Only show the relevant lines — no boilerplate unless the boilerplate is the point.
- If a snippet needs explanation, put it before the block, not after.

## Workflow

1. Ask the user for the topic, any key points they want to hit, and a rough pubDate if they have one.
2. Draft the post.
3. Ask for feedback. Update the draft based on their notes.
4. Once approved, write the file to `src/content/blog/<slug>.md`.
