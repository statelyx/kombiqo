import { describe, expect, it, vi } from 'vitest';
vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }));
import worker, { AnalysisBudget } from '../server/worker.mjs';

function memoryStorage() {
  const entries = new Map<string, unknown>();
  const storage = { get: async (key: string) => structuredClone(entries.get(key)), put: async (key: string, value: unknown) => { entries.set(key, structuredClone(value)); }, transaction: async (fn: (tx: unknown) => unknown) => fn(storage) };
  return storage;
}
describe('deployed worker', () => {
  it('preserves the global budget across object restarts and disables external providers by default', async () => {
    const storage = memoryStorage();
    const env = { CF_FREE_ONLY_VERIFIED: 'true', AI: { run: vi.fn() } };
    const budget = new AnalysisBudget({ storage }, env);
    for (let i = 0; i < 30; i++) expect(await budget.reserve('cloudflare')).toBe(true);
    const restarted = new AnalysisBudget({ storage }, env);
    expect(await restarted.reserve('cloudflare')).toBe(false);
    expect(await restarted.reserve('hf')).toBe(false);
    expect(await restarted.reserve('rapid-fashion')).toBe(false);
  });
  it('blocks external origins and URL inputs before forwarding to a model', async () => {
    const get = vi.fn();
    const env = { BUDGET: { get }, WEB_ORIGIN: 'http://localhost:8082' };
    expect((await worker.fetch(new Request('https://example.com/analyze', { method: 'POST', headers: { Origin: 'https://other.example', 'Content-Type': 'application/json' }, body: '{}' }), env)).status).toBe(403);
    expect((await worker.fetch(new Request('https://example.com/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: 'http://internal/secret' }) }), env)).status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });
  it('limits each client to five attempts without storing their photos', async () => {
    const storage = memoryStorage();
    const budget = new AnalysisBudget({ storage }, {});
    budget.analyze = vi.fn().mockResolvedValue({ source: 'device', fields: {} });
    for (let i = 0; i < 6; i++) await budget.fetch(new Request('https://internal/analyze', { method: 'POST', body: JSON.stringify({ image: 'test-photo', client: '127.0.0.1' }) }));
    expect(budget.analyze).toHaveBeenCalledTimes(5);
    expect(JSON.stringify(await storage.get('clients'))).not.toContain('test-photo');
    expect(JSON.stringify(await storage.get('clients'))).not.toContain('127.0.0.1');
  });
});
