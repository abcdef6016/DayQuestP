import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const project = dirname(fileURLToPath(import.meta.url));

export async function verifyWebAssets(directory) {
  const root = resolve(directory);
  const checked = new Set();
  const errors = [];

  async function check(reference, from, required = true) {
    const local = reference.trim();
    if (!local || local.startsWith('#') || /^data:/i.test(local)) return;
    if (/^(?:[a-z][a-z+.-]*:|\/\/)/i.test(local)) {
      if (required) errors.push(from + ' uses a non-local asset: ' + local);
      return;
    }
    if (local.startsWith('/')) {
      errors.push(from + ' uses a root-relative asset: ' + local);
      return;
    }
    const pathname = decodeURIComponent(local.split(/[?#]/)[0]);
    const target = resolve(root, dirname(from), pathname);
    const within = relative(root, target);
    if (within === '..' || within.startsWith('..' + sep)) {
      errors.push(from + ' references an asset outside webDir: ' + local);
      return;
    }
    if (!within || pathname.endsWith('/') || checked.has(within)) return;
    checked.add(within);
    try {
      let parent = root;
      for (const segment of within.split(sep)) {
        if (!(await readdir(parent)).includes(segment)) throw Error('missing or case mismatch');
        parent = resolve(parent, segment);
      }
      const { size } = await stat(target);
      if (!size) throw Error('empty file');
      if (within.endsWith('.css')) {
        const css = await readFile(target, 'utf8');
        for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s*["']([^"']+)["']/gi))
          await check(match[1] ?? match[2], within);
      }
      if (within.endsWith('.json')) {
        const manifest = JSON.parse(await readFile(target, 'utf8'));
        for (const icon of manifest.icons ?? []) await check(icon.src, within);
        if (manifest.start_url) await check(manifest.start_url, within);
      }
    } catch {
      errors.push(from + ' references a missing, empty, or invalid asset: ' + local);
    }
  }

  // These resources are essential even if an HTML editing mistake drops their tags.
  const required = ['index.html','sw.js','manifest.json','vendor/tailwind.css','vendor/dayquest.js',
    'dayquest-theme.css','ramen.css','cottage.css','vendor/confetti.js'];
  for (const asset of required) await check(asset, 'index.html');

  const html = await readFile(resolve(root,'index.html'),'utf8');
  for (const tag of html.matchAll(/<(?:script|link|img|source|video|audio|image)\b[^>]*>/gi)) {
    for (const attribute of tag[0].matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi))
      await check(attribute[1], 'index.html');
    const srcset = tag[0].match(/\bsrcset\s*=\s*["']([^"']+)["']/i);
    if (srcset && !srcset[1].startsWith('data:')) {
      for (const entry of srcset[1].split(',')) await check(entry.trim().split(/\s+/)[0], 'index.html');
    }
  }
  for (const match of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) await check(match[1], 'index.html');

  const worker = await readFile(resolve(root,'sw.js'),'utf8').catch(() => '');
  const precache = worker.match(/const ASSETS\s*=\s*\[([^\]]+)\]/);
  for (const asset of (precache?.[1] ?? '').matchAll(/['"]([^'"]+)['"]/g)) await check(asset[1], 'sw.js');

  for (const asset of required.slice(3)) {
    if (!html.includes(asset)) errors.push('index.html does not load ' + asset);
  }
  if (errors.length) throw Error('Invalid DayQuest web package (' + root + ')\n' + [...new Set(errors)].join('\n'));
  return checked;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const config = JSON.parse(await readFile(resolve(project,'capacitor.config.json'),'utf8'));
    const root = process.argv[2] ? resolve(process.argv[2]) : resolve(project,config.webDir);
    const assets = await verifyWebAssets(root);
    console.log('Verified ' + assets.size + ' local web assets in ' + root);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
