import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, DEMO_ITEMS, Migrations, NEWER_VERSION_NOTICE, SCHEMA_VERSION, UNREADABLE, createBackup, emptyData, parseBackup, readStored, toggleValue, validateAge } from '../src/domain';

const stored = (extra: Record<string, unknown> = {}) => JSON.stringify({ ...emptyData(), ...extra });

describe('stored record safety', () => {
  it('starts empty when nothing has been saved yet', () => {
    expect(readStored(null)).toEqual({ data: emptyData() });
  });
  it('refuses unreadable or half-written records instead of guessing', () => {
    expect(() => readStored('{broken')).toThrow(UNREADABLE);
    expect(() => readStored('"a string"')).toThrow(UNREADABLE);
    expect(() => readStored(JSON.stringify({ items: [] }))).toThrow(UNREADABLE);
    expect(() => readStored(stored({ items: [{ id: 'x', name: 'Eksik kayıt' }] }))).toThrow(UNREADABLE);
    expect(() => readStored(stored({ saved: [{ itemIds: [] }] }))).toThrow(UNREADABLE);
    expect(() => readStored(stored({ preferences: { styles: [], fits: 'hep' } }))).toThrow(UNREADABLE);
  });
  it('returns a valid current record untouched', () => {
    const data = { ...emptyData(), items: [...DEMO_ITEMS], onboarded: true };
    expect(readStored(JSON.stringify(data))).toEqual({ data });
  });
  it('hands back a newer record for preservation and opens empty instead of failing', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, items: [{ id: 'future' }] });
    expect(readStored(raw)).toEqual({ data: emptyData(), notice: NEWER_VERSION_NOTICE, preserved: raw });
  });
  it('applies every migration step in order up to the target version', () => {
    const steps: Migrations = {
      1: data => ({ ...data, version: 2, preferences: { ...data.preferences, styles: ['Minimal'] } }),
      2: data => ({ ...data, version: 3, items: [...data.items, DEMO_ITEMS[0]] }),
    };
    const read = readStored(stored(), 3, steps);
    expect(read.data.version).toBe(3);
    expect(read.data.items).toEqual([DEMO_ITEMS[0]]);
    expect(read.data.preferences.styles).toEqual(['Minimal']);
    expect(read.notice).toBeUndefined();
  });
  it('refuses to migrate when a step is missing', () => {
    expect(() => readStored(stored(), 3, { 1: data => ({ ...data, version: 2 }) })).toThrow(UNREADABLE);
  });
  it('refuses a migration result that is not a usable wardrobe', () => {
    expect(() => readStored(stored(), 2, { 1: data => ({ ...data, version: 2, items: 'bozuk' }) })).toThrow(UNREADABLE);
  });
});

describe('backup file', () => {
  it('writes a portable, self-describing file', () => {
    const text = createBackup(emptyData(), new Date('2026-09-15T00:00:00.000Z'));
    expect(JSON.parse(text)).toMatchObject({ format: BACKUP_FORMAT, version: SCHEMA_VERSION, createdAt: '2026-09-15T00:00:00.000Z' });
  });
  it('restores a wardrobe from its own backup text', () => {
    const data = { ...emptyData(), items: [...DEMO_ITEMS], onboarded: true, profile: { name: 'Ada', gender: 'Kadın', brands: ['Zara'] } };
    expect(parseBackup(createBackup(data))).toEqual(data);
  });
  it('restores a backup that carries surrounding whitespace', () => {
    const data = { ...emptyData(), items: [DEMO_ITEMS[0]] };
    expect(parseBackup(`\n  ${createBackup(data)}\n`)).toEqual(data);
  });
  it('refuses text that is not a Kombiqo backup', () => {
    expect(() => parseBackup('merhaba')).toThrow();
    expect(() => parseBackup('{"data":{}}')).toThrow();
    expect(() => parseBackup(JSON.stringify({ format: BACKUP_FORMAT }))).toThrow();
  });
  it('refuses a partial or damaged backup instead of half-restoring it', () => {
    expect(() => parseBackup(JSON.stringify({ format: BACKUP_FORMAT, data: { version: SCHEMA_VERSION, items: [{ id: 'x' }] } }))).toThrow();
  });
  it('refuses a backup made by a newer app version', () => {
    const future = JSON.stringify({ format: BACKUP_FORMAT, version: SCHEMA_VERSION + 1, data: { version: SCHEMA_VERSION + 1, items: [] } });
    expect(() => parseBackup(future)).toThrow();
  });
});

describe('input validation', () => {
  it('toggles a chip value without mutating the original list', () => {
    const list = ['Minimal'];
    expect(toggleValue(list, 'Klasik')).toEqual(['Minimal', 'Klasik']);
    expect(toggleValue(list, 'Minimal')).toEqual([]);
    expect(list).toEqual(['Minimal']);
  });
  it('accepts an empty or realistic age and rejects anything else', () => {
    expect(validateAge('')).toBe('');
    expect(validateAge('29')).toBe('');
    expect(validateAge('120')).toBe('');
    expect(validateAge('0')).not.toBe('');
    expect(validateAge('121')).not.toBe('');
    expect(validateAge('29a')).not.toBe('');
    expect(validateAge('1.5')).not.toBe('');
    expect(validateAge('-4')).not.toBe('');
  });
});