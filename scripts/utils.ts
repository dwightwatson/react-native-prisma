import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Extract } from 'unzipper';

export const NPM_TAGS = ['dev', 'latest'] as const;

type VersionFile = 'prisma-dev' | 'prisma-latest' | 'engine';

export type NpmTag = (typeof NPM_TAGS)[number];

export function ensureNpmTag(str: string): asserts str is NpmTag {
  if (!(NPM_TAGS as readonly string[]).includes(str)) {
    throw new Error(`${str} is not supported npm tag`);
  }
}

export function readVersionFile(file: VersionFile): Promise<string> {
  return fs.readFile(versionFilePath(file), 'utf8');
}

export function writeVersionFile(
  file: VersionFile,
  version: string
): Promise<void> {
  return fs.writeFile(versionFilePath(file), version);
}

export async function downloadEngine() {
  const version = await readVersionFile('engine');

  console.log(`Downloading engine ${version}`);

  const url = `https://binaries.prisma.sh/all_commits/${version}/react-native/binaries.zip`;

  const resp = await fetch(url);
  if (!resp.body) {
    throw new Error('Failed to read the response from binaries server');
  }
  await pipeline(
    resp.body,
    Extract({ path: path.resolve(__dirname, '..', 'engines') })
  );

  console.log('Download complete');
}
function versionFilePath(file: VersionFile): string {
  return path.resolve(__dirname, '..', '.versions', file);
}
