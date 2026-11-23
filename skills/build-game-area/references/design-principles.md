# Design principles for game areas

Read this file when you write the brief, draw the paper map, or review a blockout. Each section gives the rule, the reason, and how to check it in the engine.

## 1. Plan on paper first

- **Beat list.** Write the moments of the area in order: arrive, meet the quest giver, learn the first fight, rest, see the next area. Give each beat an intensity from 0 to 1. Put a rest beat before each spike. Open with a teach beat. [Beat charts](https://gamedeveloper.com/design/beat-chart-game-designer-s-best-friend), [level design document](https://allo.io/blog/en/level-design-document-template/)
- **Bubble diagram.** Draw each space as an oval. Its size is how big it feels, and the lines are the paths between spaces. Draw 2 or 3 different arrangements, and let the user pick one. A bad diagram is still useful, because it shows the problem early. [Gamespace prototyping](https://methods-and-tools-for-level-design.netlify.app/gamespace-prototyping)
- **Paper map.** Turn the chosen diagram into a top-down map with metres, a numbered list of sites and the main path. People can comment on a paper map before any building starts. A change on paper takes minutes. The same change after dressing and lighting takes days. [GDC 2010 Level Design in a Day](https://de.slideshare.net/LevelDesigninaDay/gdc-2010-level-design-in-a-day-part-1-preproduction-ed-byrne-creative-director-zipper-interactive)

## 2. Block out, then iterate

- A blockout is a playable version of the area that uses simple shapes and no art. It is the first point where you can play the layout. [Radiator: how to graybox](https://www.blog.radiator.debacle.us/2017/09/how-to-graybox-blockout-3d-video-game.html), [Epic: greyboxing](https://dev.epicgames.com/documentation/en-us/uefn/greyboxing-in-unreal-editor-for-fortnite)
- Keep the boxes plain, so a change does not touch art or light. Keep changing the blockout until the layout works. Add detail only after that.
- Use one colour for each meaning in the blockout: walkable ground, a wall, an interactive object, danger. A consistent colour lets everyone read the space without explanation. [Blockmesh tips, David Shaver](https://80.lv/articles/blockmesh-tips-from-david-shaver/)
- Paint or project the concept image onto a proxy shape to test sightlines before you model anything. [Open-world sightlines, Mafia III](https://www.gamedeveloper.com/design/realism-and-legibility-in-open-world-level-design)

## 3. Measure from the game

- Metrics are the scale, distances and sizes of the whole level. Take them from the real character and camera, not from memory. Build a small test space for them. [Level Design Book: metrics](https://book.leveldesignbook.com/process/blockout/metrics)
- Width for a third-person game: the character capsule, plus room for the camera on each side, plus a margin, because players do not walk in the exact centre. Add one more capsule to be safe. [Carthage level design III](https://sites.google.com/carthage.edu/game-design/lessons/level-design-iii)
- Real-world sizes to start from: a door is 1.2 m wide, and a hall is 2.5 m. Make game spaces larger than real ones, because the camera is behind the player.

## 4. Help the player read the space

The urban planner Kevin Lynch found five things that people use to build a map in their head. Nintendo used them to make the Breath of the Wild world easy to read. [Realism and legibility in open-world level design](https://gamedeveloper.com/design/realism-and-legibility-in-open-world-level-design)

| Element | What it is in an area | Check |
| --- | --- | --- |
| Paths | Roads, tracks and bridges that the player follows | The main path is clearly different from the ground next to it |
| Edges | Rivers, cliffs, walls and tree lines that stop or turn the player | Each edge looks like a stop and does not look like a path |
| Districts | Parts that have their own look: the market, the farm, the wolf woods | You can name each district from a screenshot |
| Nodes | Places where paths meet, where players stop and choose | Each node has a reason to stop: an NPC, a sign, a view |
| Landmarks | Tall, unique shapes that the player sees from far away | One landmark is visible from each node |

- **Landmarks give meaning to nodes, and nodes give meaning to landmarks.** Put a landmark at each important node.
- **Weenies.** This word comes from Disney: a tall landmark that pulls people toward it. In Ghost of Tsushima, Sucker Punch uses two types. *Flags* are tall shapes against the sky. *Breadcrumbs* are a chain of small marks that the player follows. The team removed trees that hid a weenie. [A taxonomy of weenies](https://gamedeveloper.com/design/a-taxonomy-of-weenies-the-landmarks-that-define-i-ghost-of-tsushima-i-)
- **Do not show everything.** Breath of the Wild does not put paths in a straight line from point to point, and it hides a part of the landmark so that the player goes to look. Infamous uses buildings to hide the edges of the world. [CEDEC 2017 summary](https://www.blog.radiator.debacle.us/2017/10/open-world-level-design-spatial.html), [GDC: inFAMOUS open world tricks](https://www.gamedeveloper.com/game-platforms/gdc-i-infamous-i-open-world-trickery)
- **Ground shape guides.** Hills, valleys and slopes pull the player toward places. [Breath of the Wild: gravity to go forward](https://gamedeveloper.com/design/breath-of-the-wild-open-world-analysis-gravity-to-go-forward)
- **Uniform land gets players lost.** When every hill looks the same, players open the map. Give each part a shape or colour that the player can remember.

## 5. Guide the player without signs

- **Leading lines.** Roads, fences, rivers, cables and rows of objects point the way, like arrows. [Leading lines in The Vanishing of Ethan Carter](https://gamedeveloper.com/design/guiding-the-player-leading-lines-in-quot-the-vanishing-of-ethan-carter-quot-), [Unity: guiding players without telling them](https://unity.com/blog/level-design-basics)
- **Light and colour.** These are the strongest tools: a bright doorway, or a warm light at the quest giver. Keep each colour for one meaning across the whole game. For example, yellow always means that the player can climb.
- **Breadcrumbs.** Small things in a row, such as flowers, lanterns or coins, that set a direction.
- **Explicit signs and markers** can break the feeling of the world. Keep them for entrances, exits and big changes. [Should players be hand-held?](https://dalerank.github.io/Akhenaten/devblog/should-players-be-hand-held.html)

## 6. Composition

- Split each view into three depth layers: foreground, middle ground and background. Each layer has its own job. The foreground frames the view, the middle ground is where the play happens, and the background holds the landmark. [5 rules of environment design](https://80.lv/articles/5-rules-of-environment-design)
- A free camera does not always look where you want. So build the area as many small compositions, one for each node and each approach, not as one big picture. [Composition in level design](https://gamedeveloper.com/design/composition-in-level-design)
- Plain walls make the dressing stand out. Dressing makes a place easy to remember. [Making gameplay and environments work together](https://80.lv/articles/making-gameplay-and-environments-work-together/)
- Rank the asset list as hero, mid and filler. Hero pieces are the landmarks and get the most detail. A modular kit on a fixed grid makes the building fast. [Environment artist playbook](https://www.rmcad.edu/blog/environment-artist-playbook-from-blockout-to-final-pass/)
- Place props as if people use them. A chair is pulled back from the table, and tools lie near the work. Do not align props to the grid.

## 7. MMO zones and starting areas

- **Self-contained pockets.** Each space is a pocket with a theme and clear edges. It has few exits, and the player can see each exit easily. Each place has its own activity. [Raph Koster: some zone design lessons](https://www.raphkoster.com/?p=2597)
- **What a starting hub has.** A small village or camp with the quest givers, a trainer, a vendor and a place to rest. It also has a safe space where the player learns the controls. [Warcraft wiki: starting area](https://warcraft.wiki.gg/wiki/Starting_area), [Designing an MMORPG starting zone](https://www.mmogames.com/articles/archives/designing-an-mmorpg-starting-zone)
- **Do not overload the hub.** Many quest markers in one place confuse new players. Blizzard calls this the "Christmas tree effect". Give out the quests in small groups. A hub also needs enough quests and services to be worth the stop. [GDC: WoW quest design mistakes](https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes), [GDC 2011: Cataclysm zones](https://www.engadget.com/2011/03/02/gdc-2011-tom-chilton-discusses-cataclysm-design-talent-and-zon/)
- **Open sightlines in fight areas.** A solo player must see a group of enemies before the fight starts. Put the enemy camps beside the main path, not on it. The distance from the path edge to a camp is at least the aggro radius plus 5 m, so that players choose to fight.
- **Room for a crowd.** Many players arrive at the same time. Make the paths at the hub wide. Do not put a single-file gap at the spawn point or at a quest giver. Spread out the enemies and the quest objects, so that players do not wait for each other.
- **The pull of the next area.** From the exit of the starting area, show the next area or its landmark.

## 8. Concept art is a target, not a model

- Use the concept art for the mood, the colours, the composition and the main shapes.
- Do not turn the whole painting into one 3D mesh with image-to-3D. The tool is made for one object on a plain background. A whole scene comes out flat and blurry, the light from the painting gets baked into the texture, and the hidden parts come out melted. Split the painting into objects, and make each object on its own.
- Put the area together in the engine, and keep the concept art open beside the screenshots.
