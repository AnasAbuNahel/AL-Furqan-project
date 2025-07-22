import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Bold, FileSpreadsheet } from "lucide-react";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AidHistory = () => {
  const [aidData, setAidData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("");
  const [aidTypeFilter, setAidTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentAid, setCurrentAid] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("https://al-furqan-project-xx60.onrender.com/api/aids", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sortedData = res.data.sort((a, b) => {
          const nameA = a.resident?.husband_name?.toLowerCase() || "";
          const nameB = b.resident?.husband_name?.toLowerCase() || "";
          return nameA.localeCompare(nameB, "ar");
        });
        setAidData(sortedData);
        setFiltered(sortedData);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  }, [token]);

  useEffect(() => {
    const results = aidData.filter((item) => {
      const matchesNameOrID =
        item.resident?.husband_name?.toLowerCase().includes(filter.toLowerCase()) ||
        item.resident?.husband_id_number?.includes(filter);
      const matchesAidType = aidTypeFilter ? item.aid_type === aidTypeFilter : true;
      const matchesDate = dateFilter ? item.date === dateFilter : true;
      return matchesNameOrID && matchesAidType && matchesDate;
    });
    setFiltered(results);
  }, [filter, aidTypeFilter, dateFilter, aidData]);

  const exportToExcel = () => {
    const exportData = filtered.map((item) => ({
      الاسم: item.resident?.husband_name || "",
      الهوية: item.resident?.husband_id_number || "",
      نوع_المساعدة: item.aid_type,
      التاريخ: item.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AidHistory");
    XLSX.writeFile(workbook, "كشف سجل المساعدات.xlsx");
    toast.success("تم تصدير البيانات إلى Excel بنجاح!");
  };

const handleImportExcel = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  // التعامل مع حالة فشل القراءة
  reader.onerror = (err) => {
    console.error("فشل في قراءة الملف: ", err);
    toast.error("فشل في قراءة الملف. تأكد من أن الملف بصيغة Excel الصحيحة.");
  };

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(worksheet);

      // التحقق من الأعمدة وتنسيق التواريخ
      jsonData = jsonData.map(row => {
        // التحقق من أن "تاريخ_المساعدة" هو رقم تسلسلي في Excel وتحويله إلى تاريخ
        if (row["تاريخ_المساعدة"] && typeof row["تاريخ_المساعدة"] === "number") {
          // تحويل الرقم التسلسلي إلى تاريخ
          row["تاريخ_المساعدة"] = XLSX.SSF.format('yyyy-mm-dd', row["تاريخ_المساعدة"]);
        }
        return row;
      });

      // تحقق من الأعمدة
      if (!jsonData.length) {
        toast.warn("الملف فارغ أو التنسيق غير صحيح.");
        return;
      }

      // التأكد من أن الأعمدة في الملف صحيحة
      const requiredColumns = ["الاسم", "الهوية", "نوع_المساعدة", "تاريخ_المساعدة"];
      const missingColumns = requiredColumns.filter(column => !jsonData[0].hasOwnProperty(column));

      if (missingColumns.length) {
        toast.warn(`الأعمدة التالية مفقودة في الملف: ${missingColumns.join(", ")}`);
        return;
      }

      // بقية الكود لتخزين البيانات واستيرادها كما هو
      for (const row of jsonData) {
        const { الاسم, الهوية, نوع_المساعدة, تاريخ_المساعدة } = row;

        try {
          const res = await axios.get(
            `https://al-furqan-project-xx60.onrender.com/api/residents/search?name=${encodeURIComponent(الاسم)}&id=${الهوية}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const resident = res.data;
          if (!resident || !resident.id) {
            toast.warn(`المقيم غير موجود: ${الاسم} - ${الهوية}`);
            continue;
          }

          const alreadyHelped = aidData.some(
            (aid) =>
              aid.resident?.husband_name === الاسم &&
              aid.resident?.husband_id_number === الهوية &&
              aid.aid_type === نوع_المساعدة
          );

          if (alreadyHelped) {
            toast.info(`تم تسجيل هذه المساعدة مسبقًا: ${الاسم}`);
            continue;
          }

          await axios.post(
            "https://al-furqan-project-xx60.onrender.com/api/aids",
            {
              resident_id: resident.id,
              aid_type: نوع_المساعدة,
              date: تاريخ_المساعدة,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success(`تمت إضافة المساعدة لـ ${الاسم}`);
        } catch (error) {
          console.error("خطأ أثناء الاستيراد:", error);
          toast.error(`فشل في معالجة السجل: ${الاسم}`);
        }
      }

      // إعادة تحميل البيانات بعد الاستيراد
      try {
        const res = await axios.get("https://al-furqan-project-xx60.onrender.com/api/aids", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedData = res.data.sort((a, b) => {
          const nameA = a.resident?.husband_name?.toLowerCase() || "";
          const nameB = b.resident?.husband_name?.toLowerCase() || "";
          return nameA.localeCompare(nameB, "ar");
        });
        setAidData(sortedData);
        setFiltered(sortedData);
      } catch (e) {
        console.error("خطأ في إعادة تحميل البيانات:", e);
      }
    } catch (err) {
      console.error("خطأ في معالجة البيانات:", err);
      toast.error("حدث خطأ أثناء معالجة البيانات في الملف.");
    }
  };

  reader.readAsArrayBuffer(file);
};


  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) {
      axios
        .delete(`https://al-furqan-project-xx60.onrender.com/api/aids/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          const updated = aidData.filter((item) => item.id !== id);
          setAidData(updated);
          setFiltered(updated);
          toast.success("تم حذف السجل بنجاح!");
        })
        .catch((error) => {
          console.error("Error deleting record: ", error);
          toast.error("حدث خطأ أثناء حذف السجل!");
        });
    }
  };

  const handleEdit = (aid) => {
    setCurrentAid({
      id: aid.id,
      aid_type: aid.aid_type,
      date: aid.date,
      husband_name: aid.resident?.husband_name || "",
      husband_id: aid.resident?.husband_id_number || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    const updatedAid = {
      aid_type: currentAid.aid_type,
      date: currentAid.date,
    };

    axios
      .put(`https://al-furqan-project-xx60.onrender.com/api/aids/${currentAid.id}`, updatedAid, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        const updatedList = aidData.map((item) =>
          item.id === currentAid.id
            ? {
                ...item,
                aid_type: currentAid.aid_type,
                date: currentAid.date,
                resident: {
                  ...item.resident,
                  husband_name: currentAid.husband_name,
                  husband_id_number: currentAid.husband_id,
                },
              }
            : item
        );
        setAidData(updatedList);
        setFiltered(updatedList);
        setEditModalOpen(false);
        toast.success("تم حفظ التعديلات بنجاح!");
      })
      .catch((error) => {
        console.error("Error saving edit: ", error);
        toast.error("حدث خطأ أثناء حفظ التعديلات!");
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAid((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ width: "100%", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: "32px", marginBottom: "20px", color: "#003366" }}>
        سجل المساعدات
      </h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10, direction: "rtl" }}>
        <input
          type="text"
          placeholder="ابحث بالاسم أو الهوية"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: 6,
            flex: 1,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 16,
            minWidth: 200,
          }}
        />
        <select
          value={aidTypeFilter}
          onChange={(e) => setAidTypeFilter(e.target.value)}
          style={{
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 16,
            minWidth: 180,
          }}
        >
          <option value="">كل أنواع المساعدات</option>
          {[...new Set(aidData.map((item) => item.aid_type))].map((type, i) => (
            <option key={i} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 16,
            minWidth: 180,
          }}/>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 3, direction: "rtl" }}>
          <button
            onClick={exportToExcel}
            style={{
              backgroundColor: "#4CAF50",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}>
            <FileSpreadsheet size={16} />
            تصدير Excel
          </button>
          <button
            onClick={() => document.getElementById('importExcelInput').click()} 
            style={{
              backgroundColor: "#2196f3",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <FileSpreadsheet size={16} />
            استيراد Excel
          </button>
          <input
            id="importExcelInput"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            style={{ display: "none" }} 
          />
        </div>

      </div>

      <div style={{ overflowY: "auto", border: "1px solid #ccc", borderRadius: "6px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16, fontWeight: "bold", textAlign: "center", direction: "rtl" }}>
          <thead style={{fontSize: 20, fontWeight:Bold}}>
            <tr style={{ backgroundColor: "#ddd" }}>
              <th style={{ padding: 8 }}>#</th>
              <th style={{ padding: 8 }}>الاسم</th>
              <th style={{ padding: 8 }}>الهوية</th>
              <th style={{ padding: 8 }}>نوع المساعدة</th>
              <th style={{ padding: 8 }}>التاريخ</th>
              <th style={{ padding: 8 }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((aid, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>{aid.resident?.husband_name}</td>
                <td style={{ padding: 8 }}>{aid.resident?.husband_id_number}</td>
                <td style={{ padding: 8 }}>{aid.aid_type}</td>
                <td style={{ padding: 8 }}>{aid.date}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(aid)}
                      style={{ backgroundColor: "#007bff", border: "none", color: "white", padding: "4px 8px", borderRadius: 4 }}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(aid.id)}
                      style={{ backgroundColor: "#dc3545", border: "none", color: "white", padding: "4px 8px", borderRadius: 4 }}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  لا توجد نتائج للعرض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={editModalOpen} onRequestClose={() => setEditModalOpen(false)} ariaHideApp={false}>
        <h3>تعديل سجل المساعدة</h3>
        <label>الاسم:</label>
        <input type="text" name="husband_name" value={currentAid?.husband_name || ""} onChange={handleInputChange} />
        <label>الهوية:</label>
        <input type="text" name="husband_id" value={currentAid?.husband_id || ""} onChange={handleInputChange} />
        <label>نوع المساعدة:</label>
        <input type="text" name="aid_type" value={currentAid?.aid_type || ""} onChange={handleInputChange} />
        <label>التاريخ:</label>
        <input type="date" name="date" value={currentAid?.date || ""} onChange={handleInputChange} />
        <div>
          <button onClick={() => setEditModalOpen(false)}>إلغاء</button>
          <button onClick={handleSaveEdit}>حفظ</button>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default AidHistory;
