import React, { useState, useEffect } from "react";
import { FaArrowDown, FaArrowUp, FaDollarSign } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// إعداد قاعدة Axios لكن بدون الاعتماد عليها دائماً في الطلبات (ممكن تستخدمها للمزامنة فقط)
axios.defaults.baseURL = "https://al-furqan-project-uqs4.onrender.com";
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

const DB_NAME = "al-furqan-db";
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("imports")) {
        db.createObjectStore("imports", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("exports")) {
        db.createObjectStore("exports", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("pendingSync")) {
        db.createObjectStore("pendingSync", { keyPath: "tempId" }); // لتخزين بيانات لم تُرسل بعد
      }
    },
  });
}

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [imports, setImports] = useState([]);
  const [exports, setExports] = useState([]);

  const [importData, setImportData] = useState({
    source: '',
    name: '',
    date: '',
    type: '',
    amount: ''
  });

  const [exportData, setExportData] = useState({
    description: '',
    amount: '',
    date: ''
  });

  // تحميل البيانات من IndexedDB عند بدء التشغيل
  useEffect(() => {
    async function loadLocalData() {
      const db = await getDB();
      const allImports = await db.getAll("imports");
      const allExports = await db.getAll("exports");
      setImports(allImports);
      setExports(allExports);
    }
    loadLocalData();
  }, []);

  // دالة حفظ وارد في IndexedDB + علامة لمزامنته مع السيرفر لاحقاً
  async function saveImportLocally(newImport) {
    const db = await getDB();
    const tempId = `imp-${Date.now()}`;
    const itemWithTempId = { ...newImport, tempId, synced: false };

    await db.add("imports", itemWithTempId);
    await db.put("pendingSync", { ...itemWithTempId, type: "import" });
    setImports((prev) => [...prev, itemWithTempId]);
  }

  // دالة حفظ صادر في IndexedDB + علامة لمزامنته مع السيرفر لاحقاً
  async function saveExportLocally(newExport) {
    const db = await getDB();
    const tempId = `exp-${Date.now()}`;
    const itemWithTempId = { ...newExport, tempId, synced: false };

    await db.add("exports", itemWithTempId);
    await db.put("pendingSync", { ...itemWithTempId, type: "export" });
    setExports((prev) => [...prev, itemWithTempId]);
  }

  // مزامنة البيانات غير المرسلة (pendingSync) مع السيرفر عند وجود اتصال
  async function syncPendingData() {
    if (!navigator.onLine) return; // إذا بدون إنترنت لا تفعل شيئاً

    const db = await getDB();
    const pendingItems = await db.getAll("pendingSync");

    for (const item of pendingItems) {
      try {
        if (item.type === "import") {
          // إرسال وارد
          const { tempId, synced, ...dataToSend } = item;
          const res = await axios.post("/api/imports", dataToSend);
          // حذف من pendingSync
          await db.delete("pendingSync", tempId);

          // تحديث السجل في imports: حذف القديم وإضافة الجديد من السيرفر
          await db.delete("imports", item.id || tempId); // قد لا يحتوي id لأننا استخدمنا tempId ك keyPath
          await db.add("imports", res.data);

          // تحديث الحالة في الواجهة
          setImports((prev) =>
            prev.map((imp) =>
              imp.tempId === tempId ? res.data : imp
            )
          );
        } else if (item.type === "export") {
          // إرسال صادر
          const { tempId, synced, ...dataToSend } = item;
          const res = await axios.post("/api/exports", dataToSend);
          await db.delete("pendingSync", tempId);
          await db.delete("exports", item.id || tempId);
          await db.add("exports", res.data);
          setExports((prev) =>
            prev.map((exp) =>
              exp.tempId === tempId ? res.data : exp
            )
          );
        }
      } catch (err) {
        console.error("خطأ في مزامنة بيانات:", err);
        // لو حصل خطأ لا نحذف البيانات لكي نحاول المزامنة لاحقاً
      }
    }
  }

  // مزامنة تلقائية عند الاتصال
  useEffect(() => {
    window.addEventListener("online", syncPendingData);
    return () => {
      window.removeEventListener("online", syncPendingData);
    };
  }, []);

  const totalImports = imports.reduce((sum, imp) => sum + parseFloat(imp.amount || 0), 0);
  const totalExports = exports.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalExpenses = totalImports - totalExports;

  const handlePrint = () => {
    const printSection = document.querySelector(".print-section");
    if (!printSection) return;

    printSection.style.display = "block";

    setTimeout(() => {
      window.print();
      printSection.style.display = "none";
    }, 500);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  // معالجة إرسال وارد جديد (تخزين محلي)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newImport = { ...importData, type: "مساعدات نقدية" };

    try {
      await saveImportLocally(newImport);
      toast.success("تم حفظ الإيراد محلياً");
      closeModal();
      setImportData({ source: '', name: '', date: '', type: '', amount: '' });
      syncPendingData(); // محاولة المزامنة فوراً إذا كان هناك اتصال
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ الإيراد محلياً");
    }
  };

  // معالجة إرسال صادر جديد (تخزين محلي)
  const handleExportSubmit = async (e) => {
    e.preventDefault();

    try {
      await saveExportLocally(exportData);
      toast.success("تم حفظ الصادر محلياً");
      closeExportModal();
      setExportData({ description: '', amount: '', date: '' });
      syncPendingData();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ الصادر محلياً");
    }
  };

  return (
    <div style={styles.page} dir="rtl">
      <Toaster position="top-center" />
      <h1 style={styles.pageTitle}>تقرير لجنة طوارئ الفرقان</h1>

      <div style={styles.wrapper}>
        <div style={styles.cardGroup}>
          <Card title="إجمالي الواردات" icon={<FaArrowDown style={{ color: "#3498db", fontSize: 28 }} />} value={totalImports} />
          <Card title="إجمالي الصادرات" icon={<FaArrowUp style={{ color: "#2ecc71", fontSize: 28 }} />} value={totalExports} />
          <Card title="إجمالي الرصيد" icon={<FaDollarSign style={{ color: "#9b59b6", fontSize: 28 }} />} value={totalExpenses} />
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={openModal} style={styles.primaryButton}>تسجيل الواردات</button>
          <button onClick={openExportModal} style={styles.successButton}>تسجيل الصادرات</button>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handlePrint} style={styles.darkButton}>طباعة التقرير المالي</button>
        </div>
      </div>

      {/* منطقة الطباعة */}
      <div className="print-section" style={{ display: "none", direction: "rtl", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <img src="/logo.png" alt="شعار لجنة طوارئ الفرقان" style={{ height: 60, marginLeft: 15 }} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>لجنة طوارئ الفرقان</h1>
        </div>

        <h2 style={{ textAlign: "center", fontSize: 18, marginBottom: 10 }}>
          التقرير المالي الخاص بالشعب ومراكز الإيواء
        </h2>
        <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 20 }}>
          لجنة طوارئ الفرقان
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }} border="1">
          <thead>
            <tr>
              <th colSpan="3">الإيرادات</th>
              <th colSpan="3">المصروفات</th>
            </tr>
            <tr>
              <th>م</th>
              <th>البيان</th>
              <th>المبلغ</th>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(imports.length, exports.length) }).map((_, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{imports[index]?.name || ""} - {imports[index]?.source || ""}</td>
                <td>{imports[index]?.amount || ""}</td>
                <td>{exports[index]?.date || ""}</td>
                <td>{exports[index]?.description || ""}</td>
                <td>{exports[index]?.amount || ""}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="2"><strong>الإجمالي</strong></td>
              <td><strong>{totalImports}</strong></td>
              <td colSpan="2"><strong>الإجمالي</strong></td>
              <td><strong>{totalExports}</strong></td>
            </tr>
            <tr>
              <td colSpan="5"><strong>الرصيد</strong></td>
              <td><strong>{totalExpenses}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* مودال تسجيل وارد */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>تسجيل وارد جديد</h2>
            <div style={styles.modalContent}>
              <form onSubmit={handleSubmit}>
                <label>مصدر الوارد</label>
                <input
                  type="text"
                  value={importData.source}
                  onChange={(e) => setImportData({ ...importData, source: e.target.value })}
                  required
                />

                <label>اسم الوارد</label>
                <input
                  type="text"
                  value={importData.name}
                  onChange={(e) => setImportData({ ...importData, name: e.target.value })}
                  required
                />

                <label>التاريخ</label>
                <input
                  type="date"
                  value={importData.date}
                  onChange={(e) => setImportData({ ...importData, date: e.target.value })}
                  required
                />

                <label>المبلغ</label>
                <input
                  type="number"
                  value={importData.amount}
                  onChange={(e) => setImportData({ ...importData, amount: e.target.value })}
                  required
                />

                <div style={styles.modalActions}>
                  <button type="submit" style={styles.successButton}>حفظ</button>
                  <button type="button" onClick={closeModal} style={styles.secondaryButton}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* مودال تسجيل صادر */}
      {isExportModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>تسجيل مصروف جديد</h2>
            <div style={styles.modalContent}>
              <form onSubmit={handleExportSubmit}>
                <label>الوصف</label>
                <input
                  type="text"
                  value={exportData.description}
                  onChange={(e) => setExportData({ ...exportData, description: e.target.value })}
                  required
                />

                <label>التاريخ</label>
                <input
                  type="date"
                  value={exportData.date}
                  onChange={(e) => setExportData({ ...exportData, date: e.target.value })}
                  required
                />

                <label>المبلغ</label>
                <input
                  type="number"
                  value={exportData.amount}
                  onChange={(e) => setExportData({ ...exportData, amount: e.target.value })}
                  required
                />

                <div style={styles.modalActions}>
                  <button type="submit" style={styles.successButton}>حفظ</button>
                  <button type="button" onClick={closeExportModal} style={styles.secondaryButton}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ title, icon, value }) => (
  <div style={styles.card}>
    <div>{icon}</div>
    <div>
      <h4>{title}</h4>
      <h2>{value.toLocaleString()} ريال</h2>
    </div>
  </div>
);

const styles = {
  page: {
    margin: "0 auto",
    maxWidth: 1200,
    fontFamily: "Arial, sans-serif",
    padding: 20,
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    width: 220,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: 15,
  },
  buttonGroup: {
    display: "flex",
    gap: 15,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  successButton: {
    backgroundColor: "#2ecc71",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  darkButton: {
    backgroundColor: "#34495e",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#95a5a6",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    minWidth: 300,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 20,
  },
  modalContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  modalActions: {
    marginTop: 15,
    display: "flex",
    justifyContent: "space-between",
  },
};

export default Dashboard;
