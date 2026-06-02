import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateMetadata } from './lib/llm';
import { writeOutputs } from './lib/output-writer';

// Usage: tsx generate-content.ts <transcript.txt> <outDir> [transcript.srt]
// Generates youtube.md, socials.md, blog.md (and copies transcript files) from an
// already-produced transcript. No transcription/audio extraction happens here.
const [txtPath, outDir, srtPath] = process.argv.slice(2);
if (!txtPath || !outDir) {
  console.error('[produce-video:content-gen] usage: tsx generate-content.ts <transcript.txt> <outDir> [transcript.srt]');
  process.exit(1);
}

const transcript = await fs.readFile(txtPath, 'utf8');
const srt = srtPath ? await fs.readFile(srtPath, 'utf8').catch(() => transcript) : transcript;

// Feed the TIMESTAMPED transcript (SRT) so the model can derive real YouTube chapter
// start times (MM:SS). It still contains the full spoken text for title/description/blog/socials.
// Normalize chapter timecodes to clean MM:SS (or H:MM:SS) — models sometimes emit
// stray punctuation like ":00:00" or "00:00:00".
function normalizeTimecode(s: string): string {
  const parts = String(s).replace(/[^0-9:]/g, '').split(':').filter((x) => x !== '');
  if (parts.length === 0) return '00:00';
  if (parts.length === 1) return `00:${parts[0].padStart(2, '0')}`;
  if (parts.length >= 3) {
    // H:MM:SS (drop a leading zero hour for sub-hour videos)
    const [h, m, sec] = parts.slice(-3);
    return Number(h) === 0 ? `${m.padStart(2, '0')}:${sec.padStart(2, '0')}` : `${Number(h)}:${m.padStart(2, '0')}:${sec.padStart(2, '0')}`;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

const out = await generateMetadata(srt);
if (out.youtube?.chapters?.length) {
  out.youtube.chapters = out.youtube.chapters.map((c) => ({ ...c, start: normalizeTimecode(c.start) }));
}
await writeOutputs(path.resolve(outDir), out, srt, transcript);

process.stdout.write(JSON.stringify({
  ok: true,
  outDir: path.resolve(outDir),
  files: ['youtube.md', 'socials.md', 'blog.md', 'transcript.srt', 'transcript.txt'],
  blogTitle: out.blog.title,
}) + '\n');
