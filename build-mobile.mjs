import { copyFile, cp, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyWebAssets } from './verify-web-assets.mjs';

const project = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(resolve(project,'capacitor.config.json'),'utf8'));
const directory = resolve(project,config.webDir);
const within = relative(project,directory);
if (within !== 'public') throw Error('The DayQuest asset builder only owns the generated public directory.');

const assets = await verifyWebAssets(project);
const existing = await lstat(directory).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (existing && !existing.isDirectory()) throw Error('The public directory must be a regular directory.');
await mkdir(directory,{ recursive: true });
for (const asset of assets) {
  const target = resolve(directory,asset);
  await mkdir(dirname(target),{ recursive: true });
  await copyFile(resolve(project,asset),target);
}
await cp(resolve(project,'vendor'),resolve(directory,'vendor'),{ recursive: true });
const metadata = await lstat(resolve(project,'.well-known')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (metadata?.isDirectory()) {
  await cp(resolve(project,'.well-known'),resolve(directory,'.well-known'),{ recursive: true });
}
const packaged = await verifyWebAssets(directory);
console.log('Packaged and verified ' + packaged.size + ' DayQuest assets in ' + config.webDir);
