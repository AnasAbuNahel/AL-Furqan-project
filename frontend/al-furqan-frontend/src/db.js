// db.js
import { openDB } from 'idb';

const DB_NAME = 'MyAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'residents';
const PENDING_DELETE_STORE = 'pendingDeletes'; // جديد: لتخزين معرفات الحذف المعلقة
const ADMIN_STORE = 'admins';
const STATISTICS_STORE = 'statistics';

// فتح قاعدة البيانات وإنشاء object stores إذا لم تكن موجودة
export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(PENDING_DELETE_STORE)) {
        db.createObjectStore(PENDING_DELETE_STORE, {
          keyPath: 'id', // نفس معرف المقيم
        });
      }
      if (!db.objectStoreNames.contains(ADMIN_STORE)) {
        db.createObjectStore(ADMIN_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STATISTICS_STORE)) {
        db.createObjectStore(STATISTICS_STORE);
      }
    },
  });
  return db;
}

// ---------- دوال التعامل مع المقيمين ----------

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

// ---------- دوال إدارة الحذف المعلق ----------

// إضافة id إلى قائمة الحذف المعلق
export async function addPendingDelete(id) {
  const db = await initDB();
  const tx = db.transaction(PENDING_DELETE_STORE, 'readwrite');
  await tx.store.put({ id });
  await tx.done;
}

// الحصول على جميع معرفات الحذف المعلقة
export async function getAllPendingDeletes() {
  const db = await initDB();
  return await db.getAll(PENDING_DELETE_STORE);
}

// إزالة معرف من قائمة الحذف بعد مزامنته
export async function removePendingDelete(id) {
  const db = await initDB();
  const tx = db.transaction(PENDING_DELETE_STORE, 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

// ---------- دوال إدارة الـ Admins ----------

export async function saveAdmins(admins) {
  const db = await initDB();
  const tx = db.transaction(ADMIN_STORE, 'readwrite');
  await tx.store.clear();
  admins.forEach(admin => tx.store.put(admin));
  await tx.done;
}

export async function getLocalAdmins() {
  const db = await initDB();
  return await db.getAll(ADMIN_STORE);
}

// ---------- دوال إدارة الإحصائيات ----------

export async function saveStatistics(data) {
  const db = await initDB();
  const tx = db.transaction(STATISTICS_STORE, 'readwrite');
  await tx.store.put(data, 'latest');  // المفتاح 'latest' لأننا نريد قيمة واحدة فقط
  await tx.done;
}

export async function getLocalStatistics() {
  const db = await initDB();
  return await db.get(STATISTICS_STORE, 'latest');
}
