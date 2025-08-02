import React, { useState, useEffect } from "react";
import { FaArrowDown, FaArrowUp, FaDollarSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// إعداد القاعدة العامة لـ Axios
axios.defaults.baseURL = "https://al-furqan-project-xx60.onrender.com";
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

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

  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newImport = { ...importData, type: "مساعدات نقدية" };

    try {
      const res = await axios.post("https://al-furqan-project-xx60.onrender.com/api/imports", newImport);
      setImports([...imports, res.data]);
      toast.success("تم حفظ الإيراد بنجاح");
      closeModal();
      setImportData({ source: '', name: '', date: '', type: '', amount: '' });
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error("حدث خطأ أثناء حفظ الإيراد");
    }
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://al-furqan-project-xx60.onrender.com/api/exports", exportData);
      setExports([...exports, res.data]);
      toast.success("تم حفظ الصادر بنجاح");
      closeExportModal();
      setExportData({ description: '', amount: '', date: '' });
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error("حدث خطأ أثناء حفظ الصادر");
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.");
      navigate("/login"); // أو أي صفحة تسجيل دخول
      return;
    }
  
    try {
      const [importRes, exportRes] = await Promise.all([
        axios.get("/api/imports", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get("/api/exports", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      setImports(importRes.data);
      setExports(exportRes.data);
    } catch (error) {
      console.error("فشل في تحميل البيانات:", error);
      if (error.response?.status === 401) {
        toast.error("غير مصرح. يرجى تسجيل الدخول.");
        navigate("/login");
      }
    }
  };

    fetchData();
  }, []);

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

      {/* المنطقة الخاصة بالطباعة فقط */}
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
              <td><strong>{totalImports - totalExports}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>تسجيل وارد جديد</h2>
            <div style={styles.modalContent}>
              <form onSubmit={handleSubmit}>
                {[
                  { label: "الجهة الموردة", key: "source", type: "select" },
                  { label: "اسم المورد", key: "name", type: "text" },
                  { label: "تاريخ الإيراد", key: "date", type: "date" },
                  { label: "نوع الايراد", key: "type", type: "text" },
                  { label: "الكمية", key: "amount", type: "number" }
                ].map((field, idx) => (
                  <div key={idx} style={{ marginBottom: 15 }}>
                    <label>{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        value={importData[field.key]}
                        onChange={(e) => setImportData({ ...importData, [field.key]: e.target.value })}
                        style={styles.input}
                      >
                        <option value="">اختر</option>
                        <option>مبادرين</option>
                        <option>الطوارئ</option>
                        <option>مؤسسات خيرية</option>
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={importData[field.key]}
                        onChange={(e) => setImportData({ ...importData, [field.key]: e.target.value })}
                        style={styles.input}
                        required
                      />
                    )}
                  </div>
                ))}

                <div style={styles.buttonRow}>
                  <button type="button" onClick={closeModal} style={styles.cancelButton}>إلغاء</button>
                  <button type="submit" style={styles.saveButton}>حفظ</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>تسجيل صادر جديد</h2>
            <div style={styles.modalContent}>
              <form onSubmit={handleExportSubmit}>
                {[
                  { label: "البيان", key: "description", type: "text" },
                  { label: "المبلغ", key: "amount", type: "number" },
                  { label: "التاريخ", key: "date", type: "date" }
                ].map((field, idx) => (
                  <div key={idx} style={{ marginBottom: 15 }}>
                    <label>{field.label}</label>
                    <input
                      type={field.type}
                      value={exportData[field.key]}
                      onChange={(e) => setExportData({ ...exportData, [field.key]: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                ))}

                <div style={styles.buttonRow}>
                  <button type="button" onClick={closeExportModal} style={styles.cancelButton}>إلغاء</button>
                  <button type="submit" style={styles.saveButton}>حفظ</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-section, .print-section * {
                visibility: visible !important;
              }
              .print-section {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                padding: 20px;
                direction: rtl;
                background: white;
              }

              .print-section table,
              .print-section th,
              .print-section td {
                border: 1px solid black !important;
                border-collapse: collapse !important;
              }

              .print-section th,
              .print-section td {
                padding: 8px;
                text-align: center;
                font-size: 14px;
              }

              .print-section thead {
                background-color: #f0f0f0 !important;
              }

              .print-section tr:nth-child(even) {
                background-color: #fafafa !important;
              }

              .print-section tr:nth-child(odd) {
                background-color: white !important;
              }
            }
          `}
        </style>
    </div>
  );
};

const Card = ({ icon, title, value }) => (
  <div style={styles.card}>
    <div>{icon}</div>
    <h4 style={{ margin: "10px 0 5px", fontWeight: "bold" }}>{title}</h4>
    <p style={{ fontSize: 18 ,fontWeight: "bold"}}>{value.toLocaleString("ar-EG")} شيكل</p>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f4f8",
    padding: 30,
    fontFamily: "Arial, sans-serif",
  },

  pageTitle: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2c3e50"
  },
  wrapper: {
    maxWidth: 1000,
    margin: "0 auto"
  },
  cardGroup: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 250,
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "15px 30px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 22,
    fontWeight: "bold",
    minWidth: 220,
    flexGrow: 1,
    maxWidth: "90%",
    transition: "background 0.3s"
  },
  successButton: {
    backgroundColor: "#2ecc71",
    color: "#fff",
    padding: "15px 30px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 22,
    fontWeight: "bold",
    minWidth: 220,
    flexGrow: 1,
    maxWidth: "90%",
    transition: "background 0.3s"
  },

  darkButton: {
    backgroundColor: "#34495e",
    color: "#fff",
    padding: "15px 30px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 22,
    fontWeight: "bold",
    minWidth: 220,
    maxWidth: "90%",
    flexGrow: 1,
    transition: "background 0.3s",
    marginTop: 20
  },
cancelButton: {
  backgroundColor: "#e74c3c", // أحمر
  color: "#fff",
  padding: "10px 25px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
},
  saveButton: {
    backgroundColor: "#27ae60",
    color: "white",
    padding: "10px 25px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },

modalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start", // تعديل هنا
  paddingTop: 50,          // إضافة هذه الخاصية
  zIndex: 9999,
},

  modal: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto",
    direction: "rtl"
  },
  modalTitle: {
    marginBottom: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50"
  },
  modalContent: {
    fontSize: 16,
    color: "#34495e"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 16,
    marginTop: 5
  },
buttonRow: {
  display: "flex",
  justifyContent: "flex-start",
  marginTop: 20,
  gap: 15, // لإضافة مسافة بين الزرين
},

};

export default Dashboard;
