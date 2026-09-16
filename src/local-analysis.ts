import { Evidence } from './analysis-domain';

// Browser preview: color only. No remote request or fabricated classification.
export async function localEvidence(source: string): Promise<Evidence> {
  if (typeof document === 'undefined') return {};
  const image = new window.Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = source; });
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  ctx.drawImage(image, image.width * .3, image.height * .25, image.width * .4, image.height * .5, 0, 0, 24, 24);
  return { pixels: Array.from(ctx.getImageData(0, 0, 24, 24).data) };
}
