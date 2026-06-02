# app.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import os, tempfile, shutil, subprocess, json, urllib.request, re

api = FastAPI()

# -------- Config (env) ------------------------------------------------------
MODELS_DIR = os.getenv("MODELS_DIR", "/models")
MODEL_ARG  = os.getenv("WHISPER_MODEL", "base.en")
THREADS    = int(os.getenv("WHISPER_THREADS", "4"))
BEAM_SIZE  = int(os.getenv("WHISPER_BEAM_SIZE", "5"))

# Prefer the new binary; allow override via env
WHISPER_BIN = os.getenv("WHISPER_BIN", "whisper-cli")

GGML_MAP = {
    "tiny": "ggml-tiny.bin",
    "tiny.en": "ggml-tiny.en.bin",
    "base": "ggml-base.bin",
    "base.en": "ggml-base.en.bin",
    "small": "ggml-small.bin",
    "small.en": "ggml-small.en.bin",
    "medium": "ggml-medium.bin",
    "medium.en": "ggml-medium.en.bin",
    "large-v1": "ggml-large-v1.bin",
    "large-v2": "ggml-large-v2.bin",
    "large-v3": "ggml-large-v3.bin",
}

# -------- Model path resolution --------------------------------------------
def resolve_model_path() -> str:
    if os.path.sep in MODEL_ARG:
        if not os.path.exists(MODEL_ARG):
            raise FileNotFoundError(f"Model not found at {MODEL_ARG}")
        return MODEL_ARG

    fname = GGML_MAP.get(MODEL_ARG)
    if not fname:
        raise ValueError(f"Unknown model alias: {MODEL_ARG}")

    path = os.path.join(MODELS_DIR, fname)
    if not os.path.exists(path):
        os.makedirs(MODELS_DIR, exist_ok=True)
        url = f"https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{fname}"
        print(f"Downloading model {MODEL_ARG} → {path} ...")
        with urllib.request.urlopen(url) as r, open(path, "wb") as f:
            shutil.copyfileobj(r, f)
        print("Download complete.")
    return path

MODEL_PATH = "" if os.getenv("SKIP_MODEL_RESOLUTION") == "1" else resolve_model_path()

_SPECIAL_TOKEN = re.compile(r"^\[")

def _ms_to_sec(ms):
    try:
        return round(float(ms) / 1000.0, 3)
    except (TypeError, ValueError):
        return 0.0

def parse_full_json(data):
    """Parse whisper.cpp -ojf output (a `transcription` array with token-level
    offsets in ms) into (text, segments, words). Words are reconstructed from
    tokens: a new word begins on a token whose text starts with a space."""
    segments = []
    words = []
    text_parts = []

    for seg in data.get("transcription", []):
        off = seg.get("offsets", {}) or {}
        seg_text = (seg.get("text") or "").strip()
        if seg_text:
            text_parts.append(seg_text)
        segments.append({
            "start": _ms_to_sec(off.get("from", 0)),
            "end": _ms_to_sec(off.get("to", 0)),
            "text": seg_text,
        })

        current = None
        for tok in seg.get("tokens", []) or []:
            ttext = tok.get("text", "")
            if not ttext or _SPECIAL_TOKEN.match(ttext):
                continue
            toff = tok.get("offsets", {}) or {}
            t0 = _ms_to_sec(toff.get("from", 0))
            t1 = _ms_to_sec(toff.get("to", 0))
            if current is None or ttext.startswith(" "):
                if current is not None and current["word"].strip():
                    words.append(current)
                current = {"word": ttext, "start": t0, "end": t1}
            else:
                current["word"] += ttext
                current["end"] = t1
        if current is not None and current["word"].strip():
            words.append(current)

    for w in words:
        w["word"] = w["word"].strip()

    return " ".join(text_parts).strip(), segments, words

@api.get("/healthz")
def healthz():
    return {
        "ok": True,
        "model": MODEL_ARG,
        "model_path": MODEL_PATH,
        "threads": THREADS,
        "beam_size": BEAM_SIZE,
        "bin": WHISPER_BIN,
    }

def _run(bin_name: str, tmp_path: str, out_prefix: str, language, task, word_ts: bool):
    cmd = [
        bin_name, "-m", MODEL_PATH, "-f", tmp_path,
        "-ojf", "-osrt", "-of", out_prefix,
        "-t", str(THREADS), "-bs", str(BEAM_SIZE),
    ]
    if language: cmd += ["-l", language]
    if task == "translate": cmd += ["-tr"]

    try:
        proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return cmd, proc, None
    except FileNotFoundError as e:
        return cmd, None, e

@api.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str | None = Form(None),
    task: str = Form("transcribe"),
    word_ts: bool = Form(False),
):
    suffix = os.path.splitext(file.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    tmpdir = tempfile.mkdtemp()
    out_prefix = os.path.join(tmpdir, "out")

    # Try in order: env bin, whisper-cli, whisper
    candidates = [WHISPER_BIN, "whisper-cli", "whisper"]
    last = None
    for candidate in candidates:
        cmd, proc, err = _run(candidate, tmp_path, out_prefix, language, task, word_ts)
        last = (candidate, cmd, proc, err)
        if err is not None:
            continue  # binary not found; try next
        # If it produced a deprecation-only stdout and non-zero, try next
        if proc.returncode != 0 and "deprecated" in (proc.stdout.lower() + proc.stderr.lower()):
            continue
        # If it ran, break (even if non-zero; we’ll check below)
        break

    # Cleanup input file
    try: os.unlink(tmp_path)
    except: pass

    candidate, cmd, proc, err = last
    if err is not None:
        return JSONResponse(status_code=500, content={
            "error": f"whisper binary not found (tried {candidates})",
        })

    if proc is None:
        return JSONResponse(status_code=500, content={"error": "unknown subprocess state"})

    if proc.returncode != 0:
        return JSONResponse(status_code=500, content={
            "error": "whisper.cpp failed",
            "exit_code": proc.returncode,
            "stderr_tail": proc.stderr[-2000:],
            "stdout_tail": proc.stdout[-2000:],
            "cmd": " ".join(cmd),
            "tried_bins": candidates,
            "used_bin": candidate,
        })

    json_path = out_prefix + ".json"
    srt_path = out_prefix + ".srt"
    if not os.path.exists(json_path):
        return JSONResponse(status_code=500, content={
            "error": "missing JSON output",
            "stdout_tail": proc.stdout[-2000:],
            "stderr_tail": proc.stderr[-2000:],
        })

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    text, segments, words = parse_full_json(data)

    srt = None
    if os.path.exists(srt_path):
        with open(srt_path, "r", encoding="utf-8") as f:
            srt = f.read()

    return JSONResponse({
        "language": language or "en",
        "text": text,
        "segments": segments,
        "srt": srt,
        "word_timestamps": words if word_ts else None,
        "used_bin": candidate,
    })
