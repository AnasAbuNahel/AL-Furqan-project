import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChildrenRecord = () => {
  const [childrenData, setChildrenData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("");
  const [editingChild, setEditingChild] = useState(null);
  const token = localStorage.getItem("token");

  const fetchChildren = () => {
    axios
      .get("https://al-furqan-project-uqs4.onrender.com/api/children", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setChildrenData(res.data);
        setFiltered(res.data);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        toast.error("فشل في جلب بيانات الأطفال من السيرفر.");
      });
  };

  useEffect(() => {
    if (token) fetchChildren();
  }, [token]);

  useEffect(() => {
    const results = childrenData.filter((item) => {
      const matchesNameOrID =
        (item.name && item.name.toLowerCase().includes(filter.toLowerCase())) ||
        (item.id && item.id.includes(filter));

      return matchesNameOrID;
    });
    setFiltered(results);
  }, [filter, childrenData]);

  const exportToExcel = () => {
    const exportData = filtered.map((item) => ({
      الاسم: item.name,
      الهوية: item.id,
      تاريخ_الميلاد: item.birthDate,
      العمر: item.age,
      الجوال: item.phoneNumber,
      الجنس: item.gender,
      نوع_الاستفادة: item.benefitType,
      عدد_مرات_الاستفادة: item.benefitCount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChildrenRecord");
    XLSX.writeFile(workbook, "كشف سجل الأطفال.xlsx");
    toast.success("تم تصدير البيانات إلى Excel بنجاح!");
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
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

        const requiredColumns = [
          "الاسم",
          "الهوية",
          "تاريخ_الميلاد",
          "العمر",
          "الجوال",
          "الجنس",
        ];
        const missingColumns = requiredColumns.filter(
          (column) => !jsonData[0].hasOwnProperty(column)
        );

        jsonData = jsonData.map((item) => ({
          ...item,
          نوع_الاستفادة: item["نوع_الاستفادة"] || "",
          عدد_مرات_الاستفادة: item["عدد_مرات_الاستفادة"] || "",
          الجوال: item["الجوال"] || "", 
          الجنس: item["الجنس"] || "",
        }));

        if (missingColumns.length) {
          toast.warn(`الأعمدة التالية مفقودة في الملف: ${missingColumns.join(", ")}`);
          return;
        }
        console.log("البيانات المستوردة: ", jsonData);

        await axios.post(
          "https://al-furqan-project-uqs4.onrender.com/api/children/import",
          jsonData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        fetchChildren();

        toast.success("تم استيراد البيانات وحفظها في النظام بنجاح!");
      } catch (err) {
        console.error("خطأ في معالجة أو إرسال البيانات:", err);
        toast.error("حدث خطأ أثناء معالجة أو حفظ البيانات في السيرفر.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEdit = (child) => {
    setEditingChild(child);
  };

  const handleSaveEdit = (updatedChild) => {
    const updatedData = childrenData.map((child) =>
      child.id === updatedChild.id ? updatedChild : child
    );
    setChildrenData(updatedData);
    setFiltered(updatedData);
    setEditingChild(null);
    toast.success("تم تعديل البيانات بنجاح!");
  };

  const handleDelete = (id) => {
    axios.delete(`https://al-furqan-project-uqs4.onrender.com/api/children/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        const updatedData = childrenData.filter((child) => child.id !== id);
        setChildrenData(updatedData);
        setFiltered(updatedData);
        toast.success("تم حذف البيانات بنجاح!");
      })
      .catch((error) => {
        console.error("Error deleting data: ", error);
        toast.error("فشل في حذف البيانات.");
      });
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "32px",
          marginBottom: "20px",
          color: "#003366",
        }}
      >
        سجل الأطفال
      </h1>

      {/* Filters and Export/Import Buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginBottom: 10,
          direction: "rtl",
        }}
      >
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

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 3,
            direction: "rtl",
          }}
        >
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
            }}
          >
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

      {/* Table displaying the children data */}
      <div
        style={{
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            direction: "rtl",
          }}
        >
          <thead>
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
              <tr
                key={i}
                style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}
              >
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>{child.name || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.id || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.birthDate || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.age || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.phoneNumber || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.gender || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.benefitType || "غير متوفر"}</td>
                <td style={{ padding: 8 }}>{child.benefitCount || "غير متوفر"}</td>
                <td>
                  <button
                    onClick={() => handleEdit(child)}
                    style={{
                      padding: 4,
                      backgroundColor: "#4CAF50",
                      color: "white",
                      borderRadius: 4,
                    }}
                  >
                    تعديل
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(child.id)}
                    style={{
                      padding: 4,
                      backgroundColor: "#f44336",
                      color: "white",
                      borderRadius: 4,
                    }}
                  >
                    حذف
                  </button>
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

      <ToastContainer />
    </div>
  );
};

export default ChildrenRecord;
