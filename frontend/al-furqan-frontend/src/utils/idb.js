import { openDB } from 'idb';

const DB_NAME = 'al-furqan-db';
const RESIDENTS_STORE = 'pending-residents';
const AIDS_STORE = 'pending-aids';

// فتح قاعدة البيانات مع التأكد من وجود كلا الـ object stores
async function openAlFurqanDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(RESIDENTS_STORE)) {
        db.createObjectStore(RESIDENTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(AIDS_STORE)) {
        db.createObjectStore(AIDS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

// -------------------------------
// المستفيدين (Residents)
// -------------------------------
export async function saveResidentOffline(resident) {
  const db = await openAlFurqanDB();
  await db.add(RESIDENTS_STORE, resident);
}

export async function getAllOfflineResidents() {
  const db = await openAlFurqanDB();
  return db.getAll(RESIDENTS_STORE);
}

export async function clearOfflineResidents() {
  const db = await openAlFurqanDB();
  await db.clear(RESIDENTS_STORE);
}

// -------------------------------
// المساعدات (Aids)
// -------------------------------
export async function saveAidOffline(data) {
  const db = await openAlFurqanDB();
  await db.add(AIDS_STORE, {
    data,
    token: localStorage.getItem('token'),
  });

  // تسجيل Background Sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-aids');
      console.log('✅ Background Sync for aids registered');
    } catch (err) {
      console.error('❌ Sync registration failed:', err);
    }
  }
}

export async function getAllOfflineAids() {
  const db = await openAlFurqanDB();
  return db.getAll(AIDS_STORE);
}

export async function clearOfflineAids() {
  const db = await openAlFurqanDB();
  await db.clear(AIDS_STORE);
}
