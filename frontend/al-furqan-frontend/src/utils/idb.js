import { openDB } from 'idb';

const DB_NAME = 'al-furqan-db';
const STORE_NAME = 'pending-residents';

export async function saveResidentOffline(resident) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  await db.add(STORE_NAME, resident);
}

export async function getAllOfflineResidents() {
  const db = await openDB(DB_NAME, 1);
  return db.getAll(STORE_NAME);
}

export async function clearOfflineResidents() {
  const db = await openDB(DB_NAME, 1);
  await db.clear(STORE_NAME);
}
