# Vendoring provenance

`assets/whisper-service/` was copied **once** from `C:/Users/AlemTuzlak/projects/automation`:
- `Dockerfile`, `requirements.txt` — copied verbatim.
- `app.py` — copied, then MODIFIED here to emit real word-level timestamps:
  - `-oj` → `-ojf` (full JSON with tokens), `-owts` removed.
  - added `parse_full_json()` to read whisper.cpp's `transcription` array. The stock code read non-existent `segments`/`text` top-level keys (whisper.cpp uses `transcription`) and a non-existent `.wts.json` file, so it never produced word timestamps.
  - added an import-time `SKIP_MODEL_RESOLUTION` env guard so the parser is unit-testable without Docker (`MODEL_PATH = "" if os.getenv("SKIP_MODEL_RESOLUTION") == "1" else resolve_model_path()`).

This copy is **not auto-synced**. If the automation service changes meaningfully, re-copy the files and re-apply the modifications above deliberately, then re-run the tests in `scripts/` (`test_parse_full_json.py` and `argparse.test.mjs`) and the end-to-end check.

## Tests
- `scripts/test_parse_full_json.py` — pure unit test for `parse_full_json`, driven by the real captured fixture `scripts/fixtures/whisper-ojf-sample.json`. Run: `python -m pytest scripts/test_parse_full_json.py -v`.
- `scripts/argparse.test.mjs` — unit test for the runner's argument parsing and the import-guard (importing must not start Docker). Run: `node --test scripts/argparse.test.mjs`.
