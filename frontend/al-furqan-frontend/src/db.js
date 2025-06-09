// db.js
import { openDB } from 'idb';

const DB_NAME = 'MyAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'residents'; // مثال على store لتخزين بيانات المقيمين

// فتح قاعدة البيانات وإنشاء object store إذا لم تكن موجودة
export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',  // المفتاح الأساسي (يمكن أن يكون id تلقائي أو معرف فريد)
          autoIncrement: true,
        });
        // يمكنك إنشاء indexات إضافية هنا إذا أردت
        store.createIndex('name', 'name', { unique: false });
      }
    },
  });
  return db;
}

// إضافة سجل جديد
export async function addResident(resident) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.add(resident);
  await tx.done;
}

// الحصول على جميع السجلات
export async function getAllResidents() {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
}

// تحديث سجل موجود
export async function updateResident(resident) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(resident);
  await tx.done;
}

// حذف سجل حسب id
export async function deleteResident(id) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}
