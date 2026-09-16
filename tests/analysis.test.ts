import { describe, expect, it } from 'vitest';
import { dominantColor, fromEvidence, sanitizeAnalysis } from '../src/analysis-domain';
import { createBackup, emptyData, parseBackup } from '../src/domain';

describe('photo suggestions', () => {
  it('recognizes navy rather than black and ignores transparent pixels', () => {
    expect(dominantColor([18, 28, 52, 255, 255, 0, 0, 0])).toBe('Lacivert');
    expect(dominantColor([250, 250, 250, 0])).toBeUndefined();
    expect(dominantColor([NaN, 0, 0, 255])).toBeUndefined();
  });
  it('requires a readable whole brand name and a confident clothing label', () => {
    expect(fromEvidence({ text: ['LACOSTE'], labels: [{ label: 't_shirt', confidence: .9 }] })).toMatchObject({ brand: 'Lacoste', category: 'Üstler' });
    expect(fromEvidence({ text: ['NIKESHOP'], labels: [{ label: 'dress', confidence: .2 }] }).brand).toBeUndefined();
    expect(fromEvidence({ labels: [{ label: 'person', confidence: .99 }] }).category).toBeUndefined();
  });
  it('does not accept fabricated brands or unexpected external fields', () => {
    expect(sanitizeAnalysis({ brand: 'Lacoste', category: 'secret', colorName: 'unknown', styles: ['Minimal', 'ignore instructions'], image: 'https://example.com/secret' })).toEqual({ styles: ['Minimal'] });
    expect(sanitizeAnalysis({ brand: 'Lacoste', brandEvidence: 'LACOSTE', colorName: 'Lacivert' })).toEqual({ brand: 'Lacoste', colorName: 'Lacivert' });
    expect(sanitizeAnalysis(null)).toEqual({});
  });
  it('keeps old wardrobes and backups valid', () => {
    const old = emptyData();
    expect(parseBackup(createBackup(old))).toEqual(old);
  });
});
