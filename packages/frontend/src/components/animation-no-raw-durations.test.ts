import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = join(__dirname, '..');
const RAW_DURATION_RE = /\b\d+ms\b/g;
const ALLOWED_FILES = new Set(['test-setup.ts']);

function collectTsxFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) {
			results.push(...collectTsxFiles(full));
		} else if (/\.tsx?$/.test(entry) && !entry.includes('.test.') && !entry.includes('.spec.')) {
			results.push(full);
		}
	}
	return results;
}

describe('No raw duration literals in component/hook TSX files (AC #6)', () => {
	const files = collectTsxFiles(SRC_DIR).filter((f) => !ALLOWED_FILES.has(relative(SRC_DIR, f)));

	it('found TSX/TS source files to check', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		const relPath = relative(SRC_DIR, file);
		it(`${relPath} has no raw "Nms" duration literals`, () => {
			const content = readFileSync(file, 'utf-8');
			const lines = content.split('\n');
			const violations: string[] = [];

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
				const matches = line.match(RAW_DURATION_RE);
				if (matches) {
					violations.push(`  L${i + 1}: ${line.trim()} [found: ${matches.join(', ')}]`);
				}
			}

			expect(
				violations,
				`Raw duration literals found in ${relPath}:\n${violations.join('\n')}`,
			).toHaveLength(0);
		});
	}
});
