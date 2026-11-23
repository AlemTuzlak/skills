---
name: build-game-area
description: Use when the user wants to build, lay out, block out, greybox, or dress a 3D game level, zone, area, village, town, dungeon, camp, clearing, or starting area together with the agent, often from concept art, in Unity, Unreal, Godot, or Blender through MCP tools. Triggers on "build this area with me", "make the starting zone", "lay out the village", "block out this level", "turn this concept art into a level", "build the scene out with me", or /build-game-area. Don't use for one prop or character (use image-to-3d-asset), for terrain shaders only, or for procedural generation.
---

# Build a game area with the user

The user directs, and the agent builds. You build the area in small stages. Each stage has a fixed output, fixed views, and specific questions. A change costs minutes on paper, hours in a blockout, and days after dressing. So most of the design work happens on paper and in grey boxes.

The design rules (beats, Lynch's five elements, weenies, sightlines, composition and MMO zones) are in [references/design-principles.md](references/design-principles.md). Read that file at stage 1, and again at each review.

## Stages

**Wait** means: end your turn and wait for the user's answer. **Show** means: send the views, then continue with the next step in the same turn. The user can stop you at any time.

| # | Stage | You make | Gate |
| --- | --- | --- | --- |
| 0 | Setup | The editor connection, the real metrics, the review views | None. Its results go into the brief. |
| 1 | Brief | The area brief file | **Wait** for corrections or "go" |
| 2 | Paper map | 2 or 3 layout options | **Wait** for one choice |
| 3 | Blockout | Terrain shape, grey boxes, markers | **Show**, then do stage 4 |
| 4 | Play pass | A walk report on the blockout | **Wait** for "accept the layout" |
| 5 | Asset list | Pieces with source and cost, and the game data changes | **Wait** for "yes" on each paid item and on the game data. If there are none, **Show**. |
| 6 | Dressing | Five dressing steps | **Wait** after step 1 and step 5. **Show** after steps 2, 3 and 4. |
| 7 | Checks | The check results | **Wait** for "done" |

The user decides when the area is done. The concept art is a target, not a spec.

### 0. Setup

Do this before your first message to the user. Do not send the results on their own. They go into the brief.

- Connect to the editor of the current workspace. If several editors run, select the correct one.
- Read the metrics from the game. Do not guess them: the character capsule height and radius, the walk and run speed, and the camera distance, pitch and field of view.
- Find the existing kit (the catalog, the prefabs and the grid size), the project's art and level docs, and the systems that hold spawns, quests and NPCs.
- Find the concept art if the user named it. If there is no art, the brief works without it. Leave out the `concept` view.

### 1. Brief

Write the brief to a file in the repo (`docs/areas/<area>.md`, or where the project keeps area docs). Mark it as a proposal until the user accepts it. Fill in each slot. Where you are not sure, write your best default and mark it with "(default)". Ask about all open points in one message.

```markdown
# <Area name> (proposal)

- Purpose: <what the player does here, in one sentence>
- Feeling: <3 words, e.g. safe, warm, curious>
- Players: <solo or group, level band, peak players at the same time>
- Size: <width x depth in metres>
- Scene: <new scene, or the name of the existing scene and terrain>
- Neighbours: <where players come from, where they go next>
- Concept art: <paths to the files, or "none">
- Game data: <spawns, quests and NPCs that this area needs, and the system that holds them>

## Beats
| # | Beat | Site | Intensity 0-1 |
| 1 | Arrive, see the landmark | Entrance | 0.1 |

## Sites
| # | Site | Lynch element | Holds |
| 1 | Village square | Node | Quest giver, vendor |

## Landmarks
| Landmark | Height | Seen from | Pulls toward |

## Metrics
| Capsule h / r | Speeds | Camera distance / pitch / FOV | Grid | Main path width | Budget |
```

When the project has no number, use these defaults and mark them "(default)":

- Peak players in a starting area: 20.
- Main path width: 4 capsule diameters. Hub squares and spawn points: room for the peak players to stand with 1 m between them.
- Budget: measure a finished area of the same project from the same camera, and stay at or below it. If no area is finished, ask the user.

When concept art exists, list what you see in it: the landmarks, the districts, the paths, the palette and the light. Mark each element as one of these: in the kit, a kit piece with a change, or missing. Never turn the whole painting into one 3D mesh.

### 2. Paper map

Start each option from a bubble diagram: one oval for each site, with its size and its links. Then draw each option as a top-down map image, for example SVG rendered to PNG. Each map shows these things:

- The scale in metres, and north.
- The numbered sites from the brief.
- The main path from the entrance to the exit, and the side paths.
- The edges (cliffs, rivers, walls, tree lines) and the exits.
- Each landmark, and the line of sight to it from each node.

Draw 2 or 3 different options. Give each one a line on its trade-off. Do not place anything in the editor before the user picks a map.

### 3. Blockout

- Shape the terrain first: the hills, the valleys and the edges that guide the player.
- Build at true scale with plain shapes. Use one colour for each meaning: walkable, wall, interactive, danger. Use real kit pieces only where the kit already has the shape.
- Place the markers: Entrance, Exit, each site, and each spawn or encounter point. Markers are scene objects only. The real spawn, quest and NPC data comes at stage 5, after the user approves it.
- Put a stand-in at the place of each landmark, at its true height. A landmark that nobody can see in grey will not be seen in colour either.
- Save the scene. **Show** the review views, then do stage 4.

### 4. Play pass

- Bake the navigation mesh if the project uses one.
- Walk the main path with the real character. Use the play mode or a capsule probe.
- Report these things: the walk time from the entrance to the exit, each place where the character got stuck, each place where the camera hit a wall or a tree, and whether you could see the next landmark from each node.
- Ask the review questions. Ask the user to play it too, with specific questions: "Where were you unsure where to go? Which part felt empty or too long?"
- Fix the blockout, not the art. Do stages 3 and 4 again until the user says "accept the layout".

### 5. Asset list

Make one table for each piece that the area needs:

| Piece | Rank (hero, mid, filler) | Source (kit, kit change, generate, model) | Cost | Count |

- Hero pieces are the landmarks and the unique buildings. Filler pieces repeat, so make them instanced kit pieces.
- To generate a piece, first get one image of one object on a plain background. If concept art exists, cut the object out of it. If not, make the image from text in the art style of the project. Then make the 3D asset from that image, with a triangle budget. Both steps can cost credits. Put both costs in the table.
- Under the table, list the game data changes: each spawn (enemy, count, level, respawn time), each quest and each NPC, and the system that holds it.
- Wait for "yes" on each paid item and on the game data list. Then write the game data through the project's existing system.
- Add each new piece to the project's catalog or prefab library. Record its source and licence in the project's usual place.

### 6. Dressing

Dress in this order. After each step, show the review views before and after the step.

1. Landmarks and hero pieces. **Wait.**
2. Mid pieces (buildings, fences, bridges). **Show.**
3. Ground and paths (paint, decals). **Show.**
4. Filler and scatter (trees, rocks, plants, clutter). **Show.**
5. Light, fog and colour. **Wait.**

- Compose each view in three depth layers: the foreground frames the view, the middle ground holds the play, and the background holds the landmark.
- Guide the player with leading lines, light and colour. Do not use walls or signs for this.
- Place props as if people use them, not on the grid.
- After each step, check that the dressing did not block a path, a sightline or the camera.

### 7. Checks

- Walk again: the main path, each side path, each spawn point and each exit. Nothing gets stuck, and nothing falls out of the world.
- Camera: at the gameplay distance, no wall or tree hides the character at any node.
- Sightlines: from each node, you can see the next landmark.
- Crowd: the hub, the spawn points and each quest giver have room for the peak players. There is no single-file gap.
- Performance: the triangles, the draw calls and the frame time are within the budget from the brief, from the same views.
- Console: no new errors.
- Diff: only the files you meant to change. Revert the files that the editor rewrote by itself.
- Report what you ran and what you did not run.

## Saving and commits

- Save the scene at the end of each stage.
- The brief goes in the repo. The maps and the captures go in the session scratch folder.
- After each **Wait** gate that the user accepts, make a commit on a work branch, so that the user can go back. Push or open a pull request only when the user asks.

## Review views

Use the same named camera views at each stage, so that the user can compare one screenshot with the last one. Name the captures `<stage>-<view>.png`.

- `top`: an orthographic view of the whole area from above.
- `entrance`: the gameplay camera at the entrance, looking in.
- `node-<n>`: the gameplay camera at each main node.
- `exit`: the gameplay camera at the exit, looking at the next area.
- `concept`: only when concept art exists. Use the game camera's field of view. Move the camera until the horizon and the main landmark sit at the same place in the frame as in the art. Show the capture next to the art.

## Review questions

Ask these questions at each review, and add the ones that are specific to the stage:

1. Is the purpose of the area clear from the `entrance` view?
2. Can you see where to go next from each node?
3. Is the scale right? Does the character look the correct size next to the doors and the paths?
4. Only when concept art exists: which part of the art is still missing or wrong?

Collect the answers as a numbered change list. Make all the changes, then show the same views again.

## Talk in metres and names

- Say "move site 3 (the well) 5 m east", not "a bit to the left".
- Use the site numbers and the landmark names from the brief in each message.
- When the user gives a vague note ("it feels empty"), suggest 2 or 3 specific changes and let the user pick.

## Fight areas

The fight space is the goal of the area, so the path leads to it. Put each enemy group beside the path, not on it: the distance from the path edge to the group is at least the enemy's aggro radius plus 5 m. Then a player can walk past and choose when to fight. The first enemy is alone and easy to see from far away. Groups come later, after a rest beat. Spread the spawns, so that players do not wait for each other.

## When the user is in a hurry

If the user says "just build it" or "I'm in a hurry", make stages 1 and 2 shorter. Do not skip them.

1. Do stage 0. Then send one message with the brief, filled with your defaults, and one paper map. Ask: "Is this right? Change any line, or say go."
2. **Wait.** "Go" means: build the blockout from the defaults.
3. All the other gates stay the same. Changes to grey boxes are cheap. Changes after dressing are not.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| You dress the area before the user accepts the blockout | Stage 4 is a **Wait** gate. Do not dress before "accept the layout" |
| You show a different camera angle each time | Use the named review views |
| You turn the concept art into one mesh | Cut it into objects. Assemble them in the editor |
| You guess the sizes | Read the capsule and the camera from the game at stage 0 |
| The landmark is hidden by trees | Check the sightlines in the blockout and after each dressing step |
| A path is wide enough for only one player | Use the crowd check: the hub and the spawn points need room for the peak players |
| The hub shows ten quest markers at the same time | Give out the quests in small groups along the beats |
| All the land looks the same | Give each district its own shape, colour or landmark |
| You change spawn or quest data with no approval | Place markers only. List the game data at stage 5 and wait for "yes" |
| You make one large change after many notes | Make a numbered change list, then show the same views again |
| You make a paid asset with no approval | Give the cost, then wait for "yes" on each item |
