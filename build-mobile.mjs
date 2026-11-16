import { copyFile, cp, mkdir } from 'node:fs/promises';

const directory = new URL('./public/', import.meta.url);
await mkdir(directory, { recursive: true });
const assets = ['index.html', 'manifest.json', 'icon.png', 'sw.js', 'ramen.css',
  'cottage.css', 'dayquest-theme.css'];
await Promise.all(assets.map(asset => copyFile(new URL(asset, import.meta.url), new URL(asset, directory))));
await cp(new URL('./vendor/', import.meta.url), new URL('./vendor/', directory), { recursive: true });
