# Mistake & pacing detection (P2)

Input: the **working transcript** (`transcript.txt` + `transcript.words.json`) produced by `/transcribe-video` on the de-silenced video. Output: a list of flagged spans the user reviews. Each flag:

```json
{ "start": 41.2, "end": 47.8, "kind": "repeated_sentence", "excerpt": "so the way this works… so the way this works", "suggested_action": "cut", "why": "the sentence is restarted; the first attempt is incomplete" }
```

`start`/`end` are seconds (derive from `transcript.words.json` word timestamps — snap to the nearest word boundary so a cut never clips a syllable).

## Two action classes

### Mistakes → suggest CUT
- **Repeated/restated sentence:** the same sentence (or near-duplicate, >~80% token overlap) said twice in a row. Cut the weaker/earlier attempt.
- **Restarted sentence / false start:** an abandoned clause followed by a fresh start ("so if you— actually let me explain it differently").
- **Repeated concept:** the same point made twice within a short window with no new information the second time.
- **Filler run:** a dense cluster of "um / uh / like / you know" with no content.
- **Audible self-correction:** "wait, let me redo that", "scratch that", "ignore that", "let me start over" — cut from the prior sentence boundary to the restart.

### Draggy stretches → suggest SPEED-RAMP (pitch-preserved)
- Long pauses-while-typing, slow step-by-step walk-throughs, repetitive setup, or any low-information span where the words are fine but the pacing drags.
- Default ramp factor ~1.5–2×. Speech speed-ups preserve pitch (auto-editor `speed`/`--set-speed-for-range`). Prefer ramping over cutting when the content is wanted but slow.

## Rules
- **Never auto-apply.** Detection only proposes; the user decides per span (cut / speed-ramp / leave / add their own range).
- **Conservative bias.** When unsure whether something is a mistake, flag it as `leave`-default and explain — do not suggest cutting genuine content.
- **Order flags by start time.** Present them in timeline order so the user can scrub top-to-bottom.
- Mistakes and ramps are **baked into the footage** in P2 (via `desilence.mjs`'s sibling auto-editor calls — `--cut-out` for cuts, `--set-speed-for-range` for ramps), one render per round, BEFORE the P3 final transcription, so the final word timestamps match the edited timeline.

See `framing-safe-zones.md` for how the P2 preview marks these spans visually.
