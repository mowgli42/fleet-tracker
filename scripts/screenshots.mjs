#!/usr/bin/env node
/**
 * Takes screenshots of the app for the README.
 * Run after `npm run build`. Starts preview server, captures pages, then exits.
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    function tryOnce() {
      const req = http.get(BASE, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error('Server did not start in time'));
        setTimeout(tryOnce, 300);
      });
    }
    tryOnce();
  });
}

const pages = [
  { path: '/', name: 'dashboard' },
  { path: '/fleet', name: 'fleet' },
  { path: '/maintenance', name: 'maintenance' },
  { path: '/parts', name: 'parts' }
];

async function main() {
  const preview = spawn('npm', ['run', 'preview'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true
  });
  preview.stderr?.on('data', (d) => process.stderr.write(d));
  preview.on('error', (err) => {
    console.error('Failed to start preview:', err);
    process.exit(1);
  });

  try {
    await waitForServer();
  } catch (e) {
    preview.kill();
    console.error(e.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  // Load root once so CSS loads; then use client-side navigation (click links) so we
  // never do a full reload to /fleet etc. (preview serves those with relative asset paths that break).
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.app-shell', { state: 'visible' });
  await page.waitForTimeout(500);

  for (const { path: route, name } of pages) {
    if (route !== '/') {
      await page.click(`a[href="${route}"]`);
      await page.waitForURL((url) => url.pathname === route);
      await page.waitForTimeout(400);
    }
    const outPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log('Saved', outPath);
  }

  await browser.close();
  preview.kill();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
