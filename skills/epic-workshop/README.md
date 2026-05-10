# epic-workshop

Generate and shape Epic Web / Epic React style workshops following the conventions documented at https://www.epicweb.dev/get-started.

## What it does

Encodes:

- The seven Epic-instructor principles (opinions and consistency, avoid distraction, problems before solutions, desirable difficulties, experience-based instruction, instructors make their own demos, give freely)
- Operational details for running and recording an Epic-style workshop — structure, video categories, logistics defaults, recording rules
- Epic Web's exercise-comment **emoji key** — the named cast (Kody 🐨, Lily 🦺, Marty 💰, Nancy 📝, Olivia 🦉, Dominic 📜, Barry 💣, Peter 👨‍💼, Kellie 🧝‍♀️, Matthew 💪, Chuck 🏁, Alfred 🚨) and which character belongs in which kind of comment

When invoked it walks through:

1. Topic + target audience clarification (with the same-app heuristic for "should we teach X or Y")
2. Experience check — has the instructor actually shipped with this tech?
3. Exercise progression outline (so domain-specific exercises always sit on top of prior onboarding)
4. Problem-before-solution framing for each exercise
5. Live-delivery cadence before recording
6. Scope — single workshop vs. split
7. Emoji-key application when authoring exercise comments and instructions

## When to invoke

Trigger on any of:

- "Create a workshop", "generate a workshop", "design a workshop", "plan a workshop"
- "Record a workshop video", "record an exercise video"
- "Epic Web", "Epic React", "epicweb.dev"
- Designing exercises, tips, or workshop app material
- Authoring exercise comments and wondering which emoji character to use
- `/epic-workshop`

## Output

Guidance, checklists, red-flag pushback against proposed material, and authoring rules for the exercise emoji key — not code. The skill helps shape the workshop *before* exercises get written and recorded.

## Source

Based on Kent's "How to be an Epic Instructor" doc (epicweb.notion.site) and Epic Web's exercise-comment conventions.
