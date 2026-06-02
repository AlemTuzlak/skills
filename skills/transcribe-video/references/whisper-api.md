# Whisper service API (bundled)

FastAPI service (`assets/whisper-service/app.py`), container port 9001 (host 9111).

## `GET /healthz`
Returns `{ "ok": true, "model", "model_path", "threads", "beam_size", "bin" }`.

## `POST /transcribe` (multipart/form-data)
- `file` (required) — the media file. **Send a WAV** (16 kHz mono is ideal). whisper.cpp only decodes WAV; the `transcribe.mjs` runner extracts one with ffmpeg before posting.
- `language` (optional) — e.g. `en`. Empty → auto.
- `task` (optional) — `transcribe` (default) or `translate`.
- `word_ts` (optional) — `true` to include `word_timestamps`.

### Response
```json
{
  "language": "en",
  "text": "full transcript text",
  "segments": [{ "start": 0.0, "end": 2.5, "text": "..." }],
  "srt": "1\n00:00:00,000 --> ...",
  "word_timestamps": [{ "word": "Hello", "start": 0.12, "end": 0.34 }],
  "used_bin": "whisper-cli"
}
```
`start`/`end` are seconds. Word timestamps are derived from whisper.cpp `-ojf` (`--output-json-full`) token offsets:
- the service runs whisper-cli with `-ojf` and reads the `transcription` array;
- a new word begins on a token whose text starts with a space; subword tokens are appended to the current word;
- special tokens (text starting with `[`, e.g. `[_BEG_]`) are filtered out;
- token `offsets` are milliseconds, converted to seconds.
