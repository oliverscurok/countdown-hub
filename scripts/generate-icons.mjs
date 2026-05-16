import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'static/icons');

const source = await readFile(resolve(iconsDir, 'icon-source.svg'));
const maskable = await readFile(resolve(iconsDir, 'icon-maskable-source.svg'));

await mkdir(iconsDir, { recursive: true });

const jobs = [
	{ input: source, size: 192, out: 'icon-192.png' },
	{ input: source, size: 512, out: 'icon-512.png' },
	{ input: source, size: 180, out: 'apple-touch-icon.png' },
	{ input: maskable, size: 512, out: 'icon-maskable-512.png' }
];

for (const { input, size, out } of jobs) {
	const buf = await sharp(input, { density: 384 })
		.resize(size, size)
		.png({ compressionLevel: 9 })
		.toBuffer();
	await writeFile(resolve(iconsDir, out), buf);
	console.log(`✓ ${out} (${size}×${size})`);
}

console.log('Icons generated.');
