# threejs-presentation

Build a talk inside a unique 3D world, then open it locally.

This engine loads `presentation` for research, interview, craft, and the
storyboard gate. Then it copies a Vite + React Three Fiber skeleton and fills
one world designed for your topic.

## What it does

1. **Loads `presentation`.** Research first. No world yet.
2. **Stops on the world.** Proposes 2 to 4 places that fit the argument.
   No code until you pick one.
3. **Storyboards** each slide: glass form or punch, camera, time.
4. **Copies the skeleton.** Blockout world. Catalog on a hero surface.
   Punch beats use the room. Timer is optional (`T` start, `T` stop).
5. **Finishes local.** Preview open. `npm run build` writes `dist`. No upload.

## Usage

```
/threejs-presentation
make a 3D talk about X
presentation in 3D space
```

If you say "make a presentation" and do not name a medium, the agent asks once:
Slidev or Three.js world.

## Output

A Vite app at the folder you pick. Arrow keys move slides. Enter steps the
glass. `?flat=1` is the no-WebGL view.

## Layout

```
SKILL.md
references/
  interview.md       world, theme, story, timer
  catalog.md         forms + talk.js shape
  skeleton.md        what the template contains
  verification.md    running-talk checks
  blender.md         optional GLB pass
template/            Vite + R3F app copied into the talk folder
```
