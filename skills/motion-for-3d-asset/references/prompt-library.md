# Prompt library

These prompts went to `text-to-motion-3.0` and gave clips that passed QA. Each prompt follows the recipe in SKILL.md. Copy the structure, then change the body type, the prop, and the action.

The numbers come from `analyze.py`. Distances are in the units of the character, so compare them with `figureHeightM` of the same clip.

## Combat idle (loop)

```text
a big tired warrior breathing hard after a fight, standing low with feet wide apart, both hands holding a heavy two-handed axe in front of his hips. His chest heaves with deep breaths, he rolls his shoulders and neck, shifts his weight from one foot to the other, adjusts his grip on the axe handle, and glances left and right, then returns to the same low stance.
```

Result: about 2.3 times the joint motion of a plain "stands low and breathes" idle. Loop window 1.67 s with a 2.7 degree seam.

Weak version (almost frozen, 14 deg/s mean joint speed):

```text
a heavy warrior stands low with feet wide apart and knees deeply bent, shoulders hunched forward, both hands gripping a heavy two-handed axe in front of the hips. The chest heaves with heavy breaths, the shoulders rise and fall, the weight rolls slowly from one leg to the other, and the head turns a little to look around.
```

The weak version describes a pose with small motions. The strong version gives the body tasks: roll, shift, adjust, glance.

## Charge run (loop)

```text
a heavy warrior charges forward at a full aggressive run, leaning his chest far forward, holding a heavy two-handed axe with both hands across his body at chest height. His heavy feet pound the ground with long powerful strides, his shoulders swing with each step, and he keeps running straight forward.
```

Result: a leaning run with the hands together on the axe the whole time. Loop window 1.17 s (two strides) with a 3.4 degree seam. The root moves forward, so the clip carries root motion.

## Heavy overhead cleave

```text
a heavy warrior with both hands together on the handle of a heavy two-handed axe sinks low and slowly twists the torso back to the right, lifting the axe high over the right shoulder. Then the whole body explodes forward: the hips turn, the back foot pushes, and both arms swing the axe hard diagonally down across the body to the left. The swing pulls the torso around and he stumbles half a step to catch the weight, breathes, and slowly comes back up to a ready stance.
```

Result: overhead wind-up, a heavy fold through the swing, both hands on the handle (wrist gap about 0.14 of the figure height). The wrists peak at frame 44 (1.43 s).

## Leap slam

```text
a heavy warrior holding a large two-handed axe sinks into a deep crouch, then explodes upward into a big powerful jump high into the air and far forward, both hands lifting the axe high above his head while he flies. He comes crashing down hard onto both feet with deeply bent knees, slamming the axe straight down into the ground in front of him with his whole body weight, stays low for a moment, then stands back up. He stays upright and does not flip.
```

Result: 22 airborne frames (0.7 s), foot clearance about half the figure height. Lands at frame 50, the wrists peak at frame 52 (1.73 s).

Weak version (a small hop, 9 airborne frames, clearance 0.1 of the figure height):

```text
... crouches, jumps a short distance forward with the axe raised high above his head, lands hard ...
```

"A short distance" gave exactly that. Size words control the amplitude.

Run-up variant (covers twice the ground):

```text
a heavy warrior runs two big steps forward and leaps high and far into the air, raising a heavy two-handed axe over his head with both hands at the top of the jump. He lands with a heavy crash, legs bending deeply to absorb the fall, and drives the axe straight down into the ground in one huge overhead smash. He stays crouched for a moment, breathing hard, then rises.
```

## Heavy-hit stagger (enemy)

```text
a fighter standing in a guard stance is hit hard in the chest by a heavy blow from the front. The upper body snaps backward, the arms fly out, he stumbles three steps backward almost falling, catches his balance with his arms out wide, shakes his head, and raises his guard again.
```

Result: the hit lands at frame 0. The body snaps back, stumbles about one body height back, then recovers the guard.

## Slam knockdown (enemy)

```text
a fighter standing in a guard stance is blasted off his feet by a huge impact on the ground in front of him. He is thrown backward through the air, lands hard on his back, his body bounces once on the ground, and he lies on his back in pain.
```

Result: thrown back through the air, flat on the back at frame 76 (2.53 s, lowest pelvis), then lies still.
