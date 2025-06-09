import { openDB } from 'idb';

const DB_NAME = 'al-furqan-db';
const DB_VERSION = 1;
const RESIDENTS_STORE = 'pending-residents';
const AIDS_STORE = 'pending-aids';

let dbInstance = null;

// فتح قاعدة البيانات مع التأكد من وجود كلا الـ object stores
async function openAlFurqanDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(RESIDENTS_STORE)) {
        db.createObjectStore(RESIDENTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(AIDS_STORE)) {
        db.createObjectStore(AIDS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return dbInstance;
}

// تسجيل Background Sync منفصل ليتم استدعاؤه عند الحاجة فقط (مرة واحدة عادة)
export async function registerBackgroundSync(tag = 'sync-aids') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register(tag);
      console.log(`✅ Background Sync (${tag}) registered`);
    } catch (err) {
      console.error(`❌ Sync registration failed:`, err);
    }
  }
}

// -------------------------------
// المستفيدين (Residents)
// -------------------------------
export async function saveResidentOffline(resident) {
  try {
    const db = await openAlFurqanDB();
    await db.put(RESIDENTS_STORE, resident);
  } catch (error) {
    console.error('Failed to save resident offline:', error);
  }
}

export async function getAllOfflineResidents() {
  try {
    const db = await openAlFurqanDB();
    return await db.getAll(RESIDENTS_STORE);
  } catch (error) {
    console.error('Failed to get offline residents:', error);
    return [];
  }
}

export async function deleteResidentOffline(id) {
  try {
    const db = await openAlFurqanDB();
    await db.delete(RESIDENTS_STORE, id);
  } catch (error) {
    console.error('Failed to delete offline resident:', error);
  }
}

export async function clearOfflineResidents() {
  try {
    const db = await openAlFurqanDB();
    await db.clear(RESIDENTS_STORE);
  } catch (error) {
    console.error('Failed to clear offline residents:', error);
  }
}

// -------------------------------
// المساعدات (Aids)
// -------------------------------
export async function saveAidOffline(aid) {
  try {
    const db = await openAlFurqanDB();
    await db.put(AIDS_STORE, aid);
  } catch (error) {
    console.error('Failed to save aid offline:', error);
  }
}

export async function getAllOfflineAids() {
  try {
    const db = await openAlFurqanDB();
    return await db.getAll(AIDS_STORE);
  } catch (error) {
    console.error('Failed to get offline aids:', error);
    return [];
  }
}

export async function updateAidOffline(aid) {
  try {
    const db = await openAlFurqanDB();
    await db.put(AIDS_STORE, aid);
  } catch (error) {
    console.error('Failed to update aid offline:', error);
  }
}

export async function deleteAidOffline(id) {
  try {
    const db = await openAlFurqanDB();
    await db.delete(AIDS_STORE, id);
  } catch (error) {
    console.error('Failed to delete offline aid:', error);
  }
}

export async function clearOfflineAids() {
  try {
    const db = await openAlFurqanDB();
    await db.clear(AIDS_STORE);
  } catch (error) {
    console.error('Failed to clear offline aids:', error);
  }
}
