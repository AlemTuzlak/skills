# amazing-video

A strong video needs a strong brief, and typing it again for every topic is slow. This skill saves the brief. You only type the topic:

```text
/amazing-video "make a video on PR #1234"
```

## What it does

- **Fixed brief.** The text after the command becomes the topic. The rest of the brief never changes.
- **Showreel quality.** The agent makes a dynamic 30-second motion graphics video, like a showreel for its résumé.
- **Slow pacing.** People must be able to follow the video and digest the visuals.
- **No questions.** The agent researches first, then makes all decisions. It can make more than one video.

If you want to approve the plan before the render, use [hyperframes-video](../hyperframes-video) instead.

This is the full prompt. Your text replaces `<your topic>`:

```text
make a dynamic 30-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

Topic: <your topic>

Goal: make it click for people and make the pacing slow enough for people to follow and digest the visuals.

Start with research. You make all decisions. Feel free to make multiple videos.
```

## Usage

Run the command with your topic:

```text
/amazing-video "PR #1234 and what you can build with it"
```

- The topic can be a PR, a feature, an API, or an idea.
- If you give no topic, the agent asks for one.
- The skill runs only when you call it. A normal "make a video" request does not load it.

### Other agents

Claude Code puts the text after the command into the prompt. Some other agents, such as Codex, do not do this. In those agents, name the skill and give the topic in one message:

```text
Use the amazing-video skill. Topic: PR #1234 and what you can build with it.
```

## Output

You get one or more finished videos about your topic. The skill does not name a video tool, so the agent picks one. If the HyperFrames skills are installed, the agent uses them and renders `mp4` files.
