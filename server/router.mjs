import { createHash } from 'node:crypto';
import { cleanFields } from './providers.mjs';

export function createRouter({ providers, quota, request = fetch, timeoutMs = 4500, now = Date.now }) {
  const cache = new Map(), inFlight = new Map(), cooldown = new Map();
  return async function analyze(image, signal) {
    if (signal?.aborted) return { source: 'device', fields: {} };
    const key = createHash('sha256').update(image).digest('hex');
    const cached = cache.get(key);
    if (cached && cached.until > now()) return cached.result;
    // Repeated taps do not issue another paid/free-tier request. The caller can complete locally.
    if (inFlight.has(key)) return { source: 'device', fields: {} };
    inFlight.set(key, true);
    try {
      for (const provider of providers.slice(0, 2)) {
        if (signal?.aborted) break;
        if ((cooldown.get(provider.id) ?? 0) > now() || !await quota.reserve(provider.id)) continue;
        const controller = new AbortController();
        const cancel = () => controller.abort(); signal?.addEventListener('abort', cancel);
        const timer = setTimeout(cancel, timeoutMs);
        try {
          const fields = cleanFields(await provider.run(image, controller.signal, request));
          if (controller.signal.aborted || !Object.keys(fields).length) throw new Error('empty-or-late');
          const result = { source: 'online', fields };
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(key, { result, until: now() + 3600000 });
          return result;
        } catch (error) {
          cooldown.set(provider.id, now() + ([401, 402, 403, 429].includes(error?.status) ? 86400000 : 60000));
          if ([401, 402, 403, 429].includes(error?.status)) await quota.disable(provider.id);
        } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
      }
      return { source: 'device', fields: {} };
    } finally { inFlight.delete(key); }
  };
}
