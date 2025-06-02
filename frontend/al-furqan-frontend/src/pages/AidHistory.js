import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
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
      .get("https://al-furqan-project-82pm.onrender.com/api/aids", {
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

  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) {
      axios
        .delete(`https://al-furqan-project-82pm.onrender.com/aids/${id}`, {
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
      .put(`https://al-furqan-project-82pm.onrender.com/api/aids/${currentAid.id}`, updatedAid, {
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
          }}
        />
        <button
          onClick={exportToExcel}
          style={{
            backgroundColor: "#4CAF50",
            border: "none",
            color: "white",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <FileSpreadsheet size={16} />
          Excel
        </button>
      </div>

      <div style={{ overflowY: "auto", border: "1px solid #ccc", borderRadius: "6px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16, fontWeight: "bold", textAlign: "center", direction: "rtl" }}>
          <thead>
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

<Modal
  isOpen={editModalOpen}
  onRequestClose={() => setEditModalOpen(false)}
  ariaHideApp={false}
  style={{
    content: {
      maxWidth: "400px",
      margin: "auto",
      padding: "30px",
      borderRadius: "12px",
      border: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      fontFamily: "Arial, sans-serif",
      direction: "rtl",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
  }}
>
  <h2 style={{ marginBottom: "20px", color: "#003366", textAlign: "center" }}>
    تعديل سجل المساعدة
  </h2>

  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    <label>الاسم:</label>
    <input
      type="text"
      name="husband_name"
      value={currentAid?.husband_name || ""}
      onChange={handleInputChange}
      style={inputStyle}
    />

    <label>الهوية:</label>
    <input
      type="text"
      name="husband_id"
      value={currentAid?.husband_id || ""}
      onChange={handleInputChange}
      style={inputStyle}
    />

<label>نوع المساعدة:</label>
<select
  name="aid_type"
  value={currentAid?.aid_type || ""}
  onChange={handleInputChange}
  style={{ ...inputStyle }}
>
  <option value="">اختر نوع المساعدة</option>
  {[...new Set(aidData.map((item) => item.aid_type))].map((type, i) => (
    <option key={i} value={type}>
      {type}
    </option>
  ))}
</select>

    <label>التاريخ:</label>
    <input
      type="date"
      name="date"
      value={currentAid?.date || ""}
      onChange={handleInputChange}
      style={inputStyle}
    />
  </div>

  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
    <button
      onClick={() => setEditModalOpen(false)}
      style={{
        backgroundColor: "#f87171",
        color: "#333",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      إلغاء
    </button>
    <button
      onClick={handleSaveEdit}
      style={{
        backgroundColor: "#22c55e",
        color: "white",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      حفظ
    </button>
  </div>
</Modal>
      <ToastContainer />
    </div>
  );
};

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
};


export default AidHistory;
