import { expect, it } from 'vitest';
import { cutoutAvailable, removeBackground } from '../src/cutout';
it('does not pretend background removal works on unsupported platforms', async () => {
  expect(cutoutAvailable).toBe(false);
  await expect(removeBackground('data:image/jpeg;base64,YWJj')).rejects.toThrow('iOS 17');
});
