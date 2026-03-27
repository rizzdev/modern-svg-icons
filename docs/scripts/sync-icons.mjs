import { cpSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(__dirname, '..');
const monoRoot = resolve(docsRoot, '..');

const srcIcons = resolve(monoRoot, 'icons');
const destIcons = resolve(docsRoot, 'public', 'icons');
const srcCategories = resolve(monoRoot, 'scripts', 'categories.json');
const destCategories = resolve(docsRoot, 'public', 'categories.json');

mkdirSync(destIcons, { recursive: true });
cpSync(srcIcons, destIcons, { recursive: true });
cpSync(srcCategories, destCategories);

console.log(`Synced icons/ (${srcIcons}) → ${destIcons}`);
console.log(`Synced categories.json → ${destCategories}`);
