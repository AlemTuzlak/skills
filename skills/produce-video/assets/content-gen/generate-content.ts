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

const out = await generateMetadata(transcript);
await writeOutputs(path.resolve(outDir), out, srt, transcript);

process.stdout.write(JSON.stringify({
  ok: true,
  outDir: path.resolve(outDir),
  files: ['youtube.md', 'socials.md', 'blog.md', 'transcript.srt', 'transcript.txt'],
  blogTitle: out.blog.title,
}) + '\n');
