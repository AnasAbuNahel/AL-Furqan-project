import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Bold, FileSpreadsheet } from "lucide-react";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChildRegistration = () => {
  const [children, setChildren] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentChild, setCurrentChild] = useState(null);
  const token = localStorage.getItem("token");

  // تحميل البيانات من الخادم
  useEffect(() => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول.");
      return;
    }

    axios
      .get("https://al-furqan-project-xx60.onrender.com/api/child", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sortedData = res.data.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || "";
          const nameB = b.name?.toLowerCase() || "";
          return nameA.localeCompare(nameB, "ar");
        });
        setChildren(sortedData);
        setFiltered(sortedData);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        toast.error("حدث خطأ أثناء تحميل البيانات.");
      });
  }, [token]);

  // تصفية البيانات حسب البحث
  useEffect(() => {
    const results = children.filter((item) => {
      return (
        item.name?.toLowerCase().includes(filter.toLowerCase()) ||
        item.id?.includes(filter)
      );
    });
    setFiltered(results);
  }, [filter, children]);

  // تصدير البيانات إلى إكسل
  const exportToExcel = () => {
    const exportData = filtered.map((item) => ({
      الاسم: item.name || "",
      الهوية: item.id || "",
      تاريخ_الميلاد: item.birth_date || "",
      العمر: item.age || "",
      الجوال: item.phone || "",
      الجنس: item.gender || "",
      نوع_الاستفادة: item.benefit_type || "",
      عدد_مرات_الاستفادة: item.benefit_count || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChildRegistration");
    XLSX.writeFile(workbook, "سجل الأطفال.xlsx");
    toast.success("تم تصدير البيانات إلى Excel بنجاح!");
  };

  // استيراد البيانات من ملف إكسل
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let jsonData = XLSX.utils.sheet_to_json(worksheet);

        // تحقق من الأعمدة في الملف
        const requiredColumns = [
          "الاسم",
          "الهوية",
          "تاريخ_الميلاد",
          "العمر",
          "الجوال",
          "الجنس",
          "نوع_الاستفادة",
          "عدد_مرات_الاستفادة",
        ];
        const missingColumns = requiredColumns.filter(
          (column) => !jsonData[0].hasOwnProperty(column)
        );

        if (missingColumns.length) {
          toast.warn(`الأعمدة التالية مفقودة في الملف: ${missingColumns.join(", ")}`);
          return;
        }

        // إضافة البيانات إلى الخادم
        for (const row of jsonData) {
          const { الاسم, الهوية, تاريخ_الميلاد, العمر, الجوال, الجنس, نوع_الاستفادة, عدد_مرات_الاستفادة } = row;

          // تحقق من أن جميع الحقول موجودة
          if (!الاسم || !الهوية || !تاريخ_الميلاد || !العمر || !الجوال || !الجنس || !نوع_الاستفادة) {
            toast.warn(`البيانات غير مكتملة للطفل ${الاسم}`);
            continue;
          }

          try {
            await axios.post(
              "https://al-furqan-project-xx60.onrender.com/api/child",
              {
                name: الاسم,
                id: الهوية,
                birth_date: تاريخ_الميلاد,
                age: العمر,
                phone: الجوال,
                gender: الجنس,
                benefit_type: نوع_الاستفادة,
                benefit_count: عدد_مرات_الاستفادة,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`تمت إضافة الطفل ${الاسم}`);
          } catch (error) {
            console.error("خطأ أثناء الاستيراد:", error);
            toast.error(`فشل في إضافة الطفل ${الاسم}`);
          }
        }

        // إعادة تحميل البيانات بعد الاستيراد
        try {
          const res = await axios.get("https://al-furqan-project-xx60.onrender.com/api/child", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const sortedData = res.data.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || "";
            const nameB = b.name?.toLowerCase() || "";
            return nameA.localeCompare(nameB, "ar");
          });
          setChildren(sortedData);
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

  // فتح نافذة تعديل بيانات الطفل
  const handleEdit = (child) => {
    setCurrentChild({
      id: child.id,
      name: child.name,
      birth_date: child.birth_date,
      age: child.age,
      phone: child.phone,
      gender: child.gender,
      benefit_type: child.benefit_type,
      benefit_count: child.benefit_count,
    });
    setEditModalOpen(true);
  };

  // حفظ التعديلات
  const handleSaveEdit = () => {
    const updatedChild = { ...currentChild };
    axios
      .put(`https://al-furqan-project-xx60.onrender.com/api/child/${currentChild.id}`, updatedChild, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        const updatedList = children.map((item) =>
          item.id === currentChild.id ? updatedChild : item
        );
        setChildren(updatedList);
        setFiltered(updatedList);
        setEditModalOpen(false);
        toast.success("تم حفظ التعديلات بنجاح!");
      })
      .catch((error) => {
        console.error("Error saving edit: ", error);
        toast.error("حدث خطأ أثناء حفظ التعديلات!");
      });
  };

  // حذف بيانات الطفل
  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) {
      axios
        .delete(`https://al-furqan-project-xx60.onrender.com/api/child/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          const updated = children.filter((item) => item.id !== id);
          setChildren(updated);
          setFiltered(updated);
          toast.success("تم حذف السجل بنجاح!");
        })
        .catch((error) => {
          console.error("Error deleting record: ", error);
          toast.error("حدث خطأ أثناء حذف السجل!");
        });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentChild((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ width: "100%", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: "32px", marginBottom: "20px", color: "#003366" }}>
        سجل الأطفال
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
        <div style={{ display: "flex", gap: 10 }}>
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
            onClick={() => document.getElementById("importExcelInput").click()}
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
            }}>
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
          <thead style={{ fontSize: 20, fontWeight: Bold }}>
            <tr style={{ backgroundColor: "#ddd" }}>
              <th style={{ padding: 8 }}>#</th>
              <th style={{ padding: 8 }}>الاسم</th>
              <th style={{ padding: 8 }}>الهوية</th>
              <th style={{ padding: 8 }}>تاريخ الميلاد</th>
              <th style={{ padding: 8 }}>العمر</th>
              <th style={{ padding: 8 }}>الجوال</th>
              <th style={{ padding: 8 }}>الجنس</th>
              <th style={{ padding: 8 }}>نوع الاستفادة</th>
              <th style={{ padding: 8 }}>عدد مرات الاستفادة</th>
              <th style={{ padding: 8 }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>{child.name}</td>
                <td style={{ padding: 8 }}>{child.id}</td>
                <td style={{ padding: 8 }}>{child.birth_date}</td>
                <td style={{ padding: 8 }}>{child.age}</td>
                <td style={{ padding: 8 }}>{child.phone}</td>
                <td style={{ padding: 8 }}>{child.gender}</td>
                <td style={{ padding: 8 }}>{child.benefit_type}</td>
                <td style={{ padding: 8 }}>{child.benefit_count}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(child)}
                      style={{ backgroundColor: "#007bff", border: "none", color: "white", padding: "4px 8px", borderRadius: 4 }}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
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
                <td colSpan={10} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  لا توجد نتائج للعرض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={editModalOpen} onRequestClose={() => setEditModalOpen(false)} ariaHideApp={false}>
        <h3>تعديل سجل الطفل</h3>
        <label>الاسم:</label>
        <input type="text" name="name" value={currentChild?.name || ""} onChange={handleInputChange} />
        <label>الهوية:</label>
        <input type="text" name="id" value={currentChild?.id || ""} onChange={handleInputChange} />
        <label>تاريخ الميلاد:</label>
        <input type="date" name="birth_date" value={currentChild?.birth_date || ""} onChange={handleInputChange} />
        <label>العمر:</label>
        <input type="number" name="age" value={currentChild?.age || ""} onChange={handleInputChange} />
        <label>الجوال:</label>
        <input type="text" name="phone" value={currentChild?.phone || ""} onChange={handleInputChange} />
        <label>الجنس:</label>
        <input type="text" name="gender" value={currentChild?.gender || ""} onChange={handleInputChange} />
        <label>نوع الاستفادة:</label>
        <input type="text" name="benefit_type" value={currentChild?.benefit_type || ""} onChange={handleInputChange} />
        <label>عدد مرات الاستفادة:</label>
        <input type="number" name="benefit_count" value={currentChild?.benefit_count || ""} onChange={handleInputChange} />
        <div>
          <button onClick={() => setEditModalOpen(false)}>إلغاء</button>
          <button onClick={handleSaveEdit}>حفظ</button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default ChildRegistration;
