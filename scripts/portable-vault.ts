import type { PortfolioStore, Row } from '../src/app/components/portfolio/store';

type Sealed = {
  salt: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
  revision: number;
};
const encoder = new TextEncoder();

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readState(db: IDBDatabase): Promise<Sealed | undefined> {
  return result(db.transaction('vault').objectStore('vault').get('ledger'));
}

async function makeKey(password: string, salt: Sealed['salt']) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: 600000, salt },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function decode(key: CryptoKey, state: Sealed): Promise<Row[]> {
  const bytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: state.iv },
    key,
    state.data,
  );
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function seal(
  key: CryptoKey,
  salt: Sealed['salt'],
  rows: Row[],
  revision: number,
): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(rows)),
  );
  return { salt, iv, data, revision };
}

// Encryption happens outside IndexedDB. Compare revisions inside the write
// transaction so two tabs cannot overwrite changes or an in-progress migration.
function commit(db: IDBDatabase, next: Sealed): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['vault', 'domains'], 'readwrite');
    const vault = tx.objectStore('vault');
    const request = vault.get('ledger');
    let written = false;
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== next.revision - 1) return;
      vault.put(next, 'ledger');
      if (!request.result) tx.objectStore('domains').clear();
      written = true;
    };
    tx.oncomplete = () => resolve(written);
    tx.onabort = () =>
      reject(tx.error || new Error('Could not save the encrypted ledger.'));
  });
}

function store(db: IDBDatabase, key: CryptoKey): PortfolioStore {
  async function current() {
    const state = await readState(db);
    if (!state) throw new Error('Reopen the ledger.');
    return state;
  }
  async function update<T>(change: (rows: Row[]) => T): Promise<T> {
    for (;;) {
      const state = await current();
      const rows = await decode(key, state);
      const value = change(rows);
      if (await commit(db, await seal(key, state.salt, rows, state.revision + 1)))
        return value;
    }
  }
  return {
    currency: 'CNY',
    portable: true,
    list: async () => decode(key, await current()),
    add: (entries) =>
      update((rows) => {
        const names = new Set(rows.map((row) => row.id));
        let added = 0;
        for (const entry of entries) {
          if (names.has(entry.domainFull)) continue;
          names.add(entry.domainFull);
          rows.push({ ...entry, id: entry.domainFull });
          added++;
        }
        return { added, skipped: entries.length - added };
      }),
    edit: (id, entry) =>
      update((rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0 || entry.domainFull !== id)
          throw new Error('Record changed. Reload the ledger.');
        rows[index] = { ...entry, id };
        return true;
      }),
    remove: (id) =>
      update((rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index >= 0) rows.splice(index, 1);
        return true;
      }),
  };
}

export async function unlock(
  form: HTMLFormElement,
  open: (store: PortfolioStore) => Promise<unknown>,
) {
  const password = form.querySelector<HTMLInputElement>('[name=password]')!;
  const confirm = form.querySelector<HTMLInputElement>('[name=confirm]')!;
  const button = form.querySelector('button')!;
  const message = form.querySelector<HTMLElement>('[role=status]')!;
  const request = indexedDB.open('domain-locker-portfolio', 2);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('domains'))
      db.createObjectStore('domains', { keyPath: 'id' });
    db.createObjectStore('vault');
  };
  request.onblocked = () => {
    message.textContent = 'Close other ledger tabs. 请先关闭其他台账标签页。';
  };
  const db = await result(request);
  db.onversionchange = () => db.close();
  const initial = await readState(db);
  confirm.parentElement!.hidden = !!initial;
  confirm.required = !initial;
  password.autocomplete = initial ? 'current-password' : 'new-password';
  message.textContent = initial
    ? 'Unlock ledger · 解锁台账'
    : 'Create a password (12+ characters) · 设置至少 12 位密码并妥善保管，无法找回。';
  button.disabled = false;
  form.onsubmit = async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      const state = await readState(db);
      if (!state && (password.value.length < 12 || password.value !== confirm.value))
        throw new Error(
          'Enter matching passwords of at least 12 characters. 请检查两次输入。',
        );
      const salt = state?.salt ?? crypto.getRandomValues(new Uint8Array(16));
      const key = await makeKey(password.value, salt);
      if (state) await decode(key, state);
      else {
        const old: Row[] = await result(
          db.transaction('domains').objectStore('domains').getAll(),
        );
        if (!(await commit(db, await seal(key, salt, old, 1))))
          throw new Error('Reload to unlock the existing ledger.');
      }
      form.reset();
      await open(store(db, key));
      form.remove();
    } catch (error) {
      message.textContent =
        error instanceof DOMException && error.name === 'OperationError'
          ? 'Incorrect password or damaged ledger. 密码错误或数据损坏。'
          : String(error);
    } finally {
      button.disabled = false;
    }
  };
}
