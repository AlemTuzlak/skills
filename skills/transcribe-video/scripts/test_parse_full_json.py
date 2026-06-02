import json, os, importlib.util

HERE = os.path.dirname(__file__)
APP_PATH = os.path.join(HERE, "..", "assets", "whisper-service", "app.py")
os.environ["SKIP_MODEL_RESOLUTION"] = "1"   # set BEFORE importing app.py
spec = importlib.util.spec_from_file_location("whisper_app", APP_PATH)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

FIXTURE = os.path.join(HERE, "fixtures", "whisper-ojf-sample.json")

def test_parse_full_json_produces_words_and_segments():
    with open(FIXTURE, "r", encoding="utf-8") as f:
        data = json.load(f)
    text, segments, words = app.parse_full_json(data)

    assert isinstance(text, str) and len(text) > 0

    assert len(segments) >= 1
    for s in segments:
        assert isinstance(s["start"], (int, float))
        assert isinstance(s["end"], (int, float))
        assert s["end"] >= s["start"]

    assert len(words) >= 1
    for w in words:
        assert w["word"] == w["word"].strip() and w["word"] != ""
        assert not w["word"].startswith("[")
        assert isinstance(w["start"], (int, float))
        assert isinstance(w["end"], (int, float))
        assert w["end"] >= w["start"]
    starts = [w["start"] for w in words]
    assert starts == sorted(starts)
