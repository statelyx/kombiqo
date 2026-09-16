import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRouter } from '../server/router.mjs';
import { QuotaStore } from '../server/quota.mjs';
import { configuredProviders, fashionFields } from '../server/providers.mjs';
import { createApp } from '../server/index.mjs';

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function ledger(remaining = 2) {
  const dir = mkdtempSync(join(tmpdir(), 'kombiqo-test-')); dirs.push(dir);
  const path = join(dir, 'quota.json');
  writeFileSync(path, JSON.stringify({ hf: { remaining, validUntil: '2099-01-01' }, 'rapid-fashion': { remaining, validUntil: '2099-01-01' } }));
  return { path, quota: new QuotaStore(path) };
}
describe('zero-spend routing', () => {
  it('does not enable a provider just because a key exists', () => {
    expect(configuredProviders({ HF_TOKEN: 'test', RAPIDAPI_KEY: 'test' })).toEqual([]);
  });
  it('fails closed for missing, exhausted, corrupt, or expired quotas and persists reservations', () => {
    const { path, quota } = ledger(1);
    expect(quota.reserve('hf')).toBe(true);
    expect(new QuotaStore(path).reserve('hf')).toBe(false);
    expect(JSON.parse(readFileSync(path, 'utf8')).hf.remaining).toBe(0);
    expect(quota.reserve('unknown')).toBe(false);
    writeFileSync(path, '{broken'); expect(quota.reserve('hf')).toBe(false);
    writeFileSync(path, JSON.stringify({ hf: { remaining: 10, validUntil: '2000-01-01' } })); expect(quota.reserve('hf')).toBe(false);
  });
  it('tries the backup on quota errors, disables primary and caches successful results', async () => {
    const { quota } = ledger();
    const primary = vi.fn().mockRejectedValue(Object.assign(new Error('quota'), { status: 429 }));
    const backup = vi.fn().mockResolvedValue({ category: 'Üstler' });
    const analyze = createRouter({ providers: [{ id: 'hf', run: primary }, { id: 'rapid-fashion', run: backup }], quota });
    expect(await analyze('one')).toEqual({ source: 'online', fields: { category: 'Üstler' } });
    await analyze('one'); expect(backup).toHaveBeenCalledTimes(1);
    await analyze('two'); expect(primary).toHaveBeenCalledTimes(1);
    expect(await analyze('three')).toEqual({ source: 'device', fields: {} });
  });
  it('falls back after a timeout and does not call a service after cancellation', async () => {
    const { quota } = ledger();
    const slow = vi.fn((_image, signal) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')))));
    const analyze = createRouter({ providers: [{ id: 'hf', run: slow }], quota, timeoutMs: 5 });
    expect(await analyze('one')).toEqual({ source: 'device', fields: {} });
    const controller = new AbortController(); controller.abort(); await analyze('two', controller.signal);
    expect(slow).toHaveBeenCalledTimes(1);
  });
  it('does not guess which garment to select in a multi-item photo', () => {
    const response = (classes: object[]) => ({ results: [{ status: { code: 'ok' }, entities: [{ objects: classes.map(classes => ({ entities: [{ classes }] })) }] }] });
    expect(fashionFields(response([{ shirt: .9 }]))).toEqual({ category: 'Üstler' });
    expect(fashionFields(response([{ shirt: .9 }, { trousers: .95 }]))).toEqual({});
  });
  it('rejects remote URLs and malformed images without invoking providers', async () => {
    const analyze = vi.fn().mockResolvedValue({ source: 'device', fields: {} });
    const app = createApp({ analyze });
    await new Promise<void>(resolve => app.listen(0, '127.0.0.1', resolve));
    const address = app.address();
    if (!address || typeof address === 'string') throw new Error('No test port');
    const base = `http://127.0.0.1:${address.port}`;
    try {
      for (const image of ['http://127.0.0.1/private', 'data:image/jpeg;base64,YWJj']) {
        const response = await fetch(base + '/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
        expect(response.status).toBe(400);
      }
      expect(analyze).not.toHaveBeenCalled();
      const valid = await fetch(base + '/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/2Q==' }) });
      expect((await valid.json()).source).toBe('device');
    } finally { await new Promise<void>(resolve => app.close(() => resolve())); }
  });
});
