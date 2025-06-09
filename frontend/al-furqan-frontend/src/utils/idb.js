import { openDB } from 'idb';

const DB_NAME = 'al-furqan-db';
const DB_VERSION = 1;
const RESIDENTS_STORE = 'pending-residents';
const AIDS_STORE = 'pending-aids';

// فتح قاعدة البيانات مع التأكد من وجود كلا الـ object stores
async function openAlFurqanDB() {
  return openDB(DB_NAME, DB_VERSION, {
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
  // استخدم put لكي تسمح بالإضافة أو التعديل
  await db.put(RESIDENTS_STORE, resident);
}

export async function getAllOfflineResidents() {
  const db = await openAlFurqanDB();
  return db.getAll(RESIDENTS_STORE);
}

export async function deleteResidentOffline(id) {
  const db = await openAlFurqanDB();
  await db.delete(RESIDENTS_STORE, id);
}

export async function clearOfflineResidents() {
  const db = await openAlFurqanDB();
  await db.clear(RESIDENTS_STORE);
}

// -------------------------------
// المساعدات (Aids)
// -------------------------------
export async function saveAidOffline(aid) {
  const db = await openAlFurqanDB();
  // ضع aid كاملاً مع مفتاح id
  await db.put(AIDS_STORE, aid);

  // تسجيل Background Sync إذا مدعوم
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

export async function updateAidOffline(aid) {
  const db = await openAlFurqanDB();
  await db.put(AIDS_STORE, aid);
}

export async function deleteAidOffline(id) {
  const db = await openAlFurqanDB();
  await db.delete(AIDS_STORE, id);
}

export async function clearOfflineAids() {
  const db = await openAlFurqanDB();
  await db.clear(AIDS_STORE);
}
