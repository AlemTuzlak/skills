import fs from 'node:fs/promises';
import path from 'node:path';

export const ensureDir = (p: string) => fs.mkdir(p, { recursive: true });

export const exists = async (p: string): Promise<boolean> => {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
};

export const baseNameNoExt = (p: string): string =>
  path.basename(p, path.extname(p));

export const getOutputPath = (inputPath: string, outDir: string): string => {
  const abs = path.resolve(inputPath);
  const base = baseNameNoExt(abs);
  return path.resolve(outDir, base);
};
