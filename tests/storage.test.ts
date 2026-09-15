import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removePhoto: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: mock }));
vi.mock('../src/photos', () => ({ removePhoto: mock.removePhoto }));
import { loadData, saveData } from '../src/storage';
import { emptyData, DEMO_ITEMS } from '../src/domain';
beforeEach(() => { vi.clearAllMocks(); mock.setItem.mockResolvedValue(undefined); });
it('keeps original photos with cutouts and removes both only when no longer referenced', async () => {
  const item = { ...DEMO_ITEMS[0], image: 'kombiqo-photo:cut.png', originalImage: 'kombiqo-photo:original.jpg', cutout: true };
  const data = { ...emptyData(), items: [item] };
  mock.getItem.mockResolvedValueOnce(JSON.stringify(data));
  await loadData();
  await saveData({ ...data, items: [{ ...item, name: 'Renamed' }] });
  expect(mock.removePhoto).not.toHaveBeenCalled();
  await saveData(emptyData());
  expect(mock.removePhoto).toHaveBeenCalledWith(item.image);
  expect(mock.removePhoto).toHaveBeenCalledWith(item.originalImage);
});
it('starts empty and restores valid saved data', async () => {
  mock.getItem.mockResolvedValueOnce(null);
  expect((await loadData()).items).toEqual([]);
  const stored = { ...emptyData(), onboarded: true };
  mock.getItem.mockResolvedValueOnce(JSON.stringify(stored));
  expect(await loadData()).toEqual(stored);
});
it('does not overwrite corrupt or incompatible data on load', async () => {
  mock.getItem.mockResolvedValueOnce('{broken');
  await expect(loadData()).rejects.toThrow();
  mock.getItem.mockResolvedValueOnce(JSON.stringify({ version: 2 }));
  await expect(loadData()).rejects.toThrow();
  expect(mock.setItem).not.toHaveBeenCalled();
});
it('serializes writes and allows retry after storage failure', async () => {
  mock.setItem.mockRejectedValueOnce(new Error('full'));
  await expect(saveData(emptyData())).rejects.toThrow('full');
  const latest = { ...emptyData(), onboarded: true };
  await saveData(latest);
  expect(JSON.parse(mock.setItem.mock.lastCall![1])).toEqual(latest);
});
it('retains the old image if wardrobe saving fails, and removes it only after success', async () => {
  const old = { ...emptyData(), items: [{ ...DEMO_ITEMS[0], image: 'kombiqo-photo:old.jpg' }] };
  mock.getItem.mockResolvedValueOnce(JSON.stringify(old));
  await loadData();
  mock.setItem.mockRejectedValueOnce(new Error('storage full'));
  await expect(saveData(emptyData())).rejects.toThrow();
  expect(mock.removePhoto).not.toHaveBeenCalled();
  await saveData(emptyData());
  expect(mock.removePhoto).toHaveBeenCalledWith('kombiqo-photo:old.jpg');
});
