import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { photoUri } from './photos';
import { localEvidence } from './local-analysis';
import { Analysis, fromEvidence, sanitizeAnalysis } from './analysis-domain';
import { DEFAULT_ANALYSIS_URL, DEFAULT_ANALYSIS_PROVIDERS } from './analysis-config';

// Only public configuration belongs in the binary. Never put provider keys here.
const endpoint = process.env.EXPO_PUBLIC_ANALYSIS_URL ?? DEFAULT_ANALYSIS_URL;
export const analysisRecipients = process.env.EXPO_PUBLIC_ANALYSIS_PROVIDERS ?? DEFAULT_ANALYSIS_PROVIDERS;
export const onlineAnalysisAvailable = /^https:\/\/[^\s]+\/analyze$/.test(endpoint) && !!analysisRecipients;
export type AnalysisResult = { fields: Analysis; source: 'device' | 'online'; fallback: boolean };
const cache = new Map<string, AnalysisResult>();

export async function analyzePhoto(source: string, online: boolean, signal: AbortSignal): Promise<AnalysisResult> {
  const key = `${online}:${source}`;
  if (signal.aborted) throw new Error('cancelled');
  const cached = cache.get(key); if (cached) return cached;
  let local: Analysis = {};
  try { local = fromEvidence(await localEvidence(source)); } catch { /* Manual completion remains available. */ }
  if (signal.aborted) throw new Error('cancelled');
  let result: AnalysisResult = { fields: local, source: 'device', fallback: online };
  if (online && onlineAnalysisAvailable) {
    const controller = new AbortController();
    const cancel = () => controller.abort(); signal.addEventListener('abort', cancel);
    const timeout = setTimeout(cancel, 12000);
    try {
      const context = ImageManipulator.manipulate(photoUri(source)); context.resize({ width: 768 });
      const rendered = await context.renderAsync();
      const compressed = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: .65, base64: true });
      if (controller.signal.aborted || !compressed.base64) throw new Error('cancelled');
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: `data:image/jpeg;base64,${compressed.base64}` }), signal: controller.signal });
      if (!response.ok) throw new Error('unavailable');
      const value = await response.json();
      if (value.source === 'online') {
        const fields = { ...local, ...sanitizeAnalysis(value.fields) };
        // Prefer the sampled garment color and actual on-device label text to a model's guess.
        if (local.colorName) fields.colorName = local.colorName;
        if (local.brand) fields.brand = local.brand;
        result = { fields, source: 'online', fallback: false };
      }
    } catch { /* No raw API errors or credentials reach the UI. */ }
    finally { clearTimeout(timeout); signal.removeEventListener('abort', cancel); }
  }
  if (signal.aborted) throw new Error('cancelled');
  // Keep only a few in-memory results; never persist uploads or suppress future online retries.
  if (!result.fallback) { if (cache.size >= 4) cache.delete(cache.keys().next().value!); cache.set(key, result); }
  return result;
}
