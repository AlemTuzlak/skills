import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from './file-utils';
import type { Output } from './schemas';

export async function writeOutputs(
  baseOut: string,
  out: Output,
  srt: string,
  transcript: string
): Promise<void> {
  await ensureDir(baseOut);

  // Write transcript files
  await fs.writeFile(path.join(baseOut, 'transcript.srt'), srt, 'utf8');
  await fs.writeFile(path.join(baseOut, 'transcript.txt'), transcript, 'utf8');

  // Write YouTube markdown
  const ytMd = formatYouTubeMarkdown(out);
  await fs.writeFile(path.join(baseOut, 'youtube.md'), ytMd, 'utf8');

  // Write socials markdown
  const socialsMd = formatSocialsMarkdown(out);
  await fs.writeFile(path.join(baseOut, 'socials.md'), socialsMd, 'utf8');

  // Write blog markdown
  await fs.writeFile(path.join(baseOut, 'blog.md'), out.blog.content, 'utf8');
}

export async function writeTranscriptOnly(
  baseOut: string,
  srtText: string
): Promise<void> {
  await ensureDir(baseOut);
  await fs.writeFile(path.join(baseOut, 'transcript.srt'), srtText, 'utf8');
  await fs.writeFile(path.join(baseOut, 'transcript.txt'), srtText, 'utf8');
}

function formatYouTubeMarkdown(out: Output): string {
  let md = `# YouTube\n\n`;
  md += `**Title**\n\n${out.youtube.title}\n\n`;
  md += `**Description**\n\n${out.youtube.description}\n\n`;
  md += `**Tags**\n\n${out.youtube.tags.map(t => `#${t}`).join(' ')}\n\n`;

  if (out.youtube.chapters?.length) {
    md += `**Chapters**\n\n`;
    md += out.youtube.chapters.map(c => `${c.start} — ${c.title}`).join('\n');
    md += '\n';
  }

  return md;
}

function formatSocialsMarkdown(out: Output): string {
  let md = `# Social Copy\n\n`;

  // X/Twitter
  md += `## X (Tweet)\n${out.socials.x.main}\n`;
  if (out.socials.x.thread?.length) {
    md += `\n**Thread**\n`;
    md += out.socials.x.thread.map((t, i) => `${i + 1}. ${t}`).join('\n');
  }

  // Bluesky
  md += `\n\n## Bluesky\n${out.socials.bluesky.post}\n\n`;

  // LinkedIn
  md += `## LinkedIn\n${out.socials.linkedin.post}\n\n`;
  if (out.socials.linkedin.hashtags?.length) {
    md += out.socials.linkedin.hashtags.map(h => `#${h}`).join(' ') + '\n\n';
  }

  // Reddit
  md += `## Reddit\n**Title:** ${out.socials.reddit.title}\n\n${out.socials.reddit.body}\n`;

  return md;
}
