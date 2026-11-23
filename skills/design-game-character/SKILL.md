---
name: design-game-character
description: Use when the user wants to create, design, or concept a game character, hero, mercenary, companion, recruitable unit, or important NPC, especially one with evolution stages, ascension tiers, or upgrade forms. Also use when the user asks for concept sheet prompts, a turnaround sheet, a character bible, or a character that feels real, believable, grounded, or not generic. Triggers on "create a new mercenary", "design a character with evolutions", "give me the image prompts for the concept sheets", "make this character feel real", or /design-game-character. Don't use for turning finished art into a 3D mesh (use image-to-3d-asset) or for animation clips (use motion-for-3d-asset).
---

# Design a game character

A believable character is a person first and a picture second. Each visible thing on them comes from their life: their trade, their wound, their home, their money. Evolution stages are beats in their story. They are not a ladder of more gold and glow. You design the person, then the stages, then the shapes, then the images. The user approves each part.

The research behind each rule, with sources, is in [references/design-principles.md](references/design-principles.md). Read that file before step 1, or before you write prompts only.

## Steps

A **step** is a part of your work. A **stage** is one evolution form of the character. **Wait** means: end your turn and wait for the user's answer. **Show** means: send it, then continue in the same turn.

| # | Step | You make | Gate |
| --- | --- | --- | --- |
| 0 | Read the project | Notes on the art rules, the roster, the world and the rig limits | None. The notes go into step 1. |
| 1 | Pitches | 3 short, different people | **Wait** for one choice or a mix |
| 2 | Character sheet | The full sheet file: core, voice, motion | **Wait** for corrections or "go" |
| 3 | Evolution arc | A table of the stages, with identity anchors | **Wait** for approval |
| 4 | Silhouettes | Black shape thumbnails for each stage, and a lineup with the roster | **Wait** for one pick for each stage |
| 5 | Concept art | Stage 1 painting, then the other stages from it | **Wait** after the stage 1 painting, and after the full lineup |
| 6 | Turnarounds | Sheets for the 3D step | **Wait** for final approval |
| 7 | Checks | The check results | **Show** |

When the user asks only for prompts, or is in a hurry, use "Prompts only" below. Do not skip the person.

### 0. Read the project

Do this before your first message. Do not send the notes on their own.

- The art direction: style, proportions (for example "heads tall"), palette, detail rules, things that are not allowed, triangle or LOD rules.
- The roster: the existing characters, their roles, main shapes and main colours. A new character must not copy one.
- The world: the setting, the regions, the factions, and the trades and customs you can draw from.
- The rig limits for the stages: the same skeleton, the same rest pose, sockets for equipped weapons. Weapons are usually separate from the outfit. Cloth below the knee may need extra bones.
- The roster images: engine captures at the battle camera, or the roster's concept sheets. You need them for the lineup at step 4.

If you cannot read one of these, say so in one line in your first message, and name what you assumed.

### 1. Pitches

Write 3 people who are clearly different. Each pitch is 4 lines:

1. Who: their role in battle, and their trade before this work.
2. Wound and flaw: what happened, and the behaviour that grew from it.
3. Contradiction: one trait that goes against their main trait.
4. Look idea: the main shape, and one signature item.

Start each pitch from something specific in the world: a trade, a custom, a folktale, a region. Do not start from a genre ("a ranger", "a paladin").

### 2. Character sheet

Write the sheet to a file in the repo (`docs/characters/<id>.md`, or where the project keeps character docs). Mark it as a proposal. Fill in each slot.

```markdown
# <Name> (proposal)

- Role: <battle role, range, what they do for the party>
- Origin: <region, trade before mercenary work, family, money>
- Age, build, posture: <...>

## Core
| Want | Need | Wound | Lie | Flaw | Contradiction | Secret |
Each part must cause the next one: the wound causes the lie, the lie causes the flaw, and the flaw blocks the need.

## Voice
- Sentences: <short or long, formal or rough>
- Words they use: <...>   Words they never use: <...>
- Tic: <a phrase or a habit of speech>
- Under stress: <what changes>
- Never: <3 things this character never does or says>

## Barks
| Recruited | Idle | Attack | Hit | Low health | Victory | Evolution | Dismissed |
2 lines for each trigger, in the voice above.

## Relationships
| Toward | Feeling | Why |  (the player's company, a rival, one faction)

## Motion
- Stance: <...>   Movement: <...>   Idle habit: <one action that shows the personality>
```

### 3. Evolution arc

Make one row for each stage:

| Stage | Story beat (what happened to them) | Visual change | Where the new gear came from | New skill or behaviour | Shape trend |

Then list the **identity anchors**. They stay the same at every stage: the face, the main shape, the 2 main colours, one signature item, and the posture. The main shape is the large form of the body and the outfit, for example "a tall, narrow triangle". It stays. The details on it can change, for example soft edges that become sharp, or a second shape that is added.

Before you show the table, run the "who made it" check from step 7 on each new piece in the table. Fix a piece with no answer now, before any paid image.

- Each stage answers "what changed in their life?", not only "they got stronger".
- Change in steps. Each stage adds or replaces one or two clear things. The silhouette changes, but it stays the same family.
- The last stage shows who they became. It is not the first stage with gold, spikes and glow added.
- Give each new piece a source: a contract payment, a trophy, a gift, a repair, a rank.
- Keep within the rig limits from step 0.

### 4. Silhouettes

- Choose one main shape and one second shape from the shape language: circle (friendly, soft), square (stable, strong), triangle (fast, sharp, dangerous). Write why.
- Make 3 to 6 black silhouette thumbnails for each stage. Image generation can cost credits. Give the cost and wait for "yes" first.
- Show each pick at the size it has from the battle camera, and in a lineup with the roster at the same scale.
- The user picks one silhouette for each stage.

### 5. Concept art

1. Paint stage 1 first. Build the prompt with the "Prompt recipe" below, and use the stage 1 silhouette from step 4 as the shape reference. **Wait** for approval.
2. Make the other stages from the stage 1 image (image to image), so that the face and the body stay the same. Describe the outline of the silhouette picked for each stage in its stage block.
3. Show all the stages side by side, in colour and in grayscale. **Wait** for approval.

### 6. Turnarounds

For each stage, make a sheet with front, side and back views, full body, for the 3D step:

- An A-pose with the arms about 45 degrees down. Empty hands, with no weapon held. A held weapon fuses into the hand mesh.
- A plain light background, even flat light, no cast shadows, no text.
- Hand the sheets to the 3D skill (for example `image-to-3d-asset`). Write the rig limits and the weapon sockets into the handoff.

### 7. Checks

**Believable**
- Each visible item answers three questions: who made it, why they wear it, and how it got worn. Remove an item with no answer.
- The wear has a cause: the bow arm, the strap, the side that faces the enemy, the knees.
- The core links: wound, then lie, then flaw, then the blocked need.
- The stranger test: give only the images to a fresh agent (a subagent with no other context). It describes the person: their job, their past, their mood. Compare its words with the sheet.
- No generic defaults (see the table below), unless the sheet gives a reason.

**The same person at each stage**
- Each identity anchor is visible at each stage.
- In a grayscale lineup at battle camera size, the stages read as one family.
- A blind test: give a fresh agent face crops of the stages mixed with crops of roster characters, in random order. It groups the ones that belong together.

**Works in the game**
- The silhouette is different from each roster character at the battle camera distance.
- The outfit fits the rig limits, and the weapons stay separate.
- The design follows the project's art direction.

## Prompt recipe

Build each image prompt from the sheet. Use three blocks:

1. **Base block, the same in each prompt:** the identity anchors. The face, the build, the hair, the posture, the 2 main colours, the signature item, and the project's art style.
2. **Stage block:** the outfit of this stage. Name each piece, its material, where it came from, and its wear. For example: "a patched ox-hide bracer on the left forearm, scuffed by the bowstring".
3. **Format block:** one of these four:
   - **Concept painting:** one full-body view in a natural pose that shows the personality.
   - **Concept sheet:** front and back full-body views side by side, and one head close-up. A natural pose, a plain light background, no text.
   - **Silhouette:** a solid black full-body shape on white, with no inner detail.
   - **Turnaround:** the rules in step 6, for the 3D step.

## Images and their source

- Save each image in the session scratch folder until the user approves it.
- Move approved images to the project's art folder.
- Record each one where the project records sources: the tool, the model, the prompt, the input image, and the date. Mark it as AI-generated.

## Prompts only

If the user asks only for prompts, or says "just give me", give the prompts in this same message. Put a short core above them, and build each prompt from that core:

```markdown
**Who:** <role, origin trade, one line>
**Wound â†’ flaw:** <one line>
**Contradiction:** <one line>
**Anchors:** <face, main shape, 2 colours, signature item, posture>
**Stages:** <one story beat for each stage, one line each>
```

Then give the prompts with the base, stage and format blocks. Use the concept sheet format unless the user names another one. Keep each stage block within the rig limits from step 0. If you do not know them, keep the cloth at the knee or higher, and add no extra limbs, wings or tails. After the prompts, add these lines:

- The order: "Generate stage 1 first. Make the other stages from the stage 1 image with image to image, so that the face stays the same."
- What was not checked: the roster lineup, the art rules or rig limits you could not read, and the turnarounds for 3D, which come later.
- "Change any line of the core, and I will rewrite the prompts."

Who generates the images:

- If the user says that they will generate the images ("so I can generate them", "I want to generate them now"), give the prompts only.
- If the user asks you to generate them, name the model and the credit cost for each image, then **Wait** for "yes".

## Generic defaults to avoid

| Generic default | Ask instead |
| --- | --- |
| A rank ladder: villager, ranger, warden, legend | What happened in their life between the stages? |
| More gold, glow, runes and spikes at each stage | What did they earn, lose or choose? |
| Clean, new, symmetrical gear | Who made it, and where does it wear out? |
| Pretty face, braid, freckles as the whole identity | Which shape and which item make them recognisable in black? |
| A backstory with no wound, or a wound with no effect | Which behaviour does the wound cause today? |
| Always calm, helpful and logical | Which irrational behaviour has a clear emotional root? |
| A copy of a character from another game | Which trade, custom or folktale of this world is the source? |

## Common mistakes

| Mistake | Fix |
| --- | --- |
| You draw before you know the person | Do steps 1 and 2 first. In "Prompts only", write the core first |
| The stages are only stronger versions | Write a story beat and a gear source for each stage |
| The face or body changes between stages | Make the later stages from the stage 1 image, and repeat the base block |
| The silhouette is close to a roster character | Compare at the battle camera size in a lineup |
| The weapon is part of the turnaround | Empty hands. The weapon is a separate asset |
| A long cape or skirt breaks the shared rig | Keep cloth within the rig limits, or ask about extra bones |
| You generate paid images with no approval | Give the cost, then wait for "yes" |
| You ignore the project's art rules | Read them at step 0, and check them at step 7 |
