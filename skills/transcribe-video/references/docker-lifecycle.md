# Docker lifecycle (transcribe-video)

- **Image:** `transcribe-video-whisper`, built from `assets/whisper-service/` (whisper.cpp + FastAPI, `ggml-base.en.bin` baked in at build).
- **Container:** `transcribe-video-whisper`, `--restart unless-stopped`, host port **9111** → container 9001. Namespaced so it never collides with the `automation` repo's `whisper` container on 9001.
- **States handled by `transcribe.mjs`:** absent → `docker run`; stopped → `docker start`; running → reuse.
- **Stop:** `node scripts/transcribe.mjs --stop`.
- **Rebuild after editing `app.py`:** the image bakes `app.py`, so a running container will not pick up edits until rebuilt + recreated:
  ```bash
  docker rm -f transcribe-video-whisper
  docker build -t transcribe-video-whisper assets/whisper-service
  ```
  The expensive whisper.cpp build stage is cached; only the late `COPY app.py` layer re-runs, so rebuilds are fast.

## Troubleshooting
- *Daemon not reachable* → start Docker Desktop.
- *Port 9111 taken* → pass `--port <n>`; the runner fails loud rather than silently choosing another port.
- *Build is very slow the first time* → expected; it compiles whisper.cpp and downloads the model. Subsequent runs reuse the image.
- *Git Bash / MSYS path mangling* → when running raw `docker exec`/`docker cp` with container paths like `/tmp/...` from Git Bash, prefix with `MSYS_NO_PATHCONV=1` so the leading-slash path is not rewritten to a Windows path. (The `transcribe.mjs` runner is unaffected — it shells out via Node, not Git Bash.)
