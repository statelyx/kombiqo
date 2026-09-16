import { readFileSync, writeFileSync, renameSync } from 'node:fs';

// A single server process owns this file. Missing/corrupt/unwritable state fails closed.
// Allowances never reset themselves; account balances are shared with other apps.
export class QuotaStore {
  constructor(path) { this.path = path; }
  update(id, consume) {
    try {
      const state = JSON.parse(readFileSync(this.path, 'utf8'));
      const entry = state[id];
      if (!entry || !Number.isSafeInteger(entry.remaining) || entry.remaining <= 0 || !Number.isFinite(Date.parse(entry.validUntil)) || Date.parse(entry.validUntil) <= Date.now()) return false;
      entry.remaining = consume ? entry.remaining - 1 : 0;
      writeFileSync(this.path + '.tmp', JSON.stringify(state), { mode: 0o600 });
      renameSync(this.path + '.tmp', this.path);
      return true;
    } catch { return false; }
  }
  reserve(id) { return this.update(id, true); }
  disable(id) { return this.update(id, false); }
}
