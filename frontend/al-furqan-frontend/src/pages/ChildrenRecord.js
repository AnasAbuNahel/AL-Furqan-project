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
  const [helpType, setHelpType] = useState("");
  const [otherHelp, setOtherHelp] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [helpChild, setHelpChild] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
  age: null,
  birth_date: null,
  benefit_type: null,
  benefit_count: null,
  });

  const [sortModal, setSortModal] = useState({ open: false, column: null });
  const [sortValue, setSortValue] = useState("");
  const [sortOperator, setSortOperator] = useState("");

  const token = localStorage.getItem("token");

  const getArabicColumnName = (key) => {
  switch (key) {
    case "age": return "العمر";
    case "benefit_count": return "عدد مرات الاستفادة";
    case "benefit_type": return "نوع الاستفادة";
    case "birth_date": return "تاريخ الميلاد";
    default: return key;
  }
  };

  const openSortModal = (column) => {
    setSortModal({ open: true, column });
    setSortOperator("");
    setSortValue("");
  };

  const applySort = () => {
  if (!sortModal.column) return;

  const updated = {
    ...activeFilters,
    [sortModal.column]: {
      operator: sortOperator || "=",
      value: sortValue,
    },
  };

  setActiveFilters(updated);
  setSortModal({ open: false, column: null });
};

  const applyAllFilters = () => {
    let results = [...children];

    Object.entries(activeFilters).forEach(([key, cond]) => {
      if (!cond) return;

      if (key === "benefit_type") {
        results = results.filter((c) => c[key] === cond.value);
      } else if (key === "birth_date") {
        const val = cond.value;
        results = results.filter((c) => {
          const date = new Date(c.birth_date).toISOString().split("T")[0];
          if (cond.operator === ">") return date > val;
          if (cond.operator === "<") return date < val;
          if (cond.operator === "=") return date === val;
          return true;
        });
      } else {
        const num = Number(cond.value);
        results = results.filter((c) => {
          const val = Number(c[key]);
          if (cond.operator === ">") return val > num;
          if (cond.operator === "<") return val < num;
          if (cond.operator === "=") return val === num;
          return true;
        });
      }
    });

    setFiltered(results);
  };

  const removeFilter = (key) => {
    const updated = { ...activeFilters, [key]: null };
    setActiveFilters(updated);
  };
  
  const clearColumnFilter = (column) => {
  const newFilters = { ...activeFilters };
  delete newFilters[column];
  setActiveFilters(newFilters);
  setSortModal({ open: false, column: null });

  applyAllFilters(newFilters);
};

  useEffect(() => {
    if (!token) {
      toast.error("الرجاء تسجيل الدخول.");
      return;
    }

    axios
      .get("https://al-furqan-project-xx60.onrender.com/api/children", {
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

  useEffect(() => {
    const results = children.filter((item) => {
      return (
        item.name?.toLowerCase().includes(filter.toLowerCase()) ||
        item.id_number?.includes(filter)
      );
    });
    setFiltered(results);
  }, [filter, children]);

  useEffect(() => {
  applyAllFilters();
  }, [activeFilters]);


  const exportToExcel = () => {
    const exportData = filtered.map((item) => ({
      الاسم: item.name || "",
      الهوية: item.id_number || "",
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

      for (const row of jsonData) {
        let { الاسم, الهوية, تاريخ_الميلاد, العمر, الجوال, الجنس, نوع_الاستفادة, عدد_مرات_الاستفادة } = row;

        if (تاريخ_الميلاد && typeof تاريخ_الميلاد === "number") {
          تاريخ_الميلاد = XLSX.SSF.format("yyyy-mm-dd", تاريخ_الميلاد);
        }

        if (!الاسم || !الهوية || !تاريخ_الميلاد || !العمر || !الجوال || !الجنس || !نوع_الاستفادة) {
          toast.warn(`البيانات غير مكتملة للطفل ${الاسم}`);
          continue;
        }

        try {
          await axios.post(
            "https://al-furqan-project-xx60.onrender.com/api/children",
            {
              name: الاسم,
              id_number: الهوية,
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

      try {
        const res = await axios.get("https://al-furqan-project-xx60.onrender.com/api/children", {
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

  const handleEdit = (child) => {
    setCurrentChild({
      id: child.id,
      name: child.name,
      id_number: child.id_number,
      birth_date: child.birth_date,
      age: child.age,
      phone: child.phone,
      gender: child.gender,
      benefit_type: child.benefit_type,
      benefit_count: child.benefit_count,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    const updatedChild = { ...currentChild };
    axios
      .put(`https://al-furqan-project-xx60.onrender.com/api/children/${currentChild.id}`, updatedChild, {
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

const handleDelete = (id) => {
  if (!token) {
    toast.error("لم يتم العثور على التوكن! يرجى تسجيل الدخول.");
    return;
  }

  if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) {
    axios
      .delete(`https://al-furqan-project-xx60.onrender.com/api/children/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        const updated = children.filter((item) => item.id_number !== id);
        setChildren(updated);
        setFiltered(updated);
        toast.success("تم حذف السجل بنجاح!");
      })
      .catch((error) => {
        console.error("Error deleting record: ", error);
        if (error.response) {
          toast.error(`حدث خطأ: ${error.response.data.message || "فشل في حذف السجل!"}`);
        } else {
          toast.error("حدث خطأ أثناء الاتصال بالخادم.");
        }
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
              <th onClick={() => openSortModal("birth_date")} style={{ cursor: "pointer" }}>تاريخ الميلاد🔽</th>
              <th onClick={() => openSortModal("age")} style={{ cursor: "pointer" }}>العمر🔽</th>
              <th style={{ padding: 8 }}>الجوال</th>
              <th style={{ padding: 8 }}>الجنس</th>
              <th onClick={() => openSortModal("benefit_type")} style={{ cursor: "pointer" }}>نوع المساعدة🔽</th>
              <th onClick={() => openSortModal("benefit_count")} style={{ cursor: "pointer" }}>عدد مرات الأستفادة🔽</th>
              <th style={{ padding: 8 }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>{child.name}</td>
                <td style={{ padding: 8 }}>{child.id_number}</td>
                <td style={{ padding: 8 }}>{child.birth_date}</td>
                <td style={{ padding: 8 }}>{child.age ? Math.floor(child.age) : ""}</td>
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
                      onClick={() => handleDelete(child.id_number)}
                      style={{ backgroundColor: "#dc3545", border: "none", color: "white", padding: "4px 8px", borderRadius: 4 }}
                    >
                      حذف
                    </button>
                    <button
                      onClick={() => {
                        setHelpChild(child); 
                        setIsModalOpen(true);
                      }}
                      style={{ backgroundColor: "#28a745", border: "none", color: "white", padding: "4px 8px", borderRadius: 4 }}
                    >
                      مساعدة
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
      <div style={{ marginBottom: 10 }}>
      {Object.entries(activeFilters).map(([key, cond]) =>
        cond ? (
          <span key={key} style={{ margin: "0 5px", background: "#eee", padding: "6px 12px", borderRadius: "6px" }}>
            {getArabicColumnName(key)}: {cond.operator} {cond.value}
            <button
              onClick={() => removeFilter(key)}
              style={{ marginRight: 8, background: "transparent", border: "none", color: "#d00", fontWeight: "bold" }}
            >
              ×
            </button>
          </span>
        ) : null
      )}
    </div>

        <Modal
          isOpen={editModalOpen}
          onRequestClose={() => setEditModalOpen(false)}
          ariaHideApp={false}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            },
            content: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "700px",
              height: "80%",
              padding: "30px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              fontFamily: "Arial, sans-serif",
              zIndex: 1001,
              animation: "fadeIn 0.5s ease-in-out",
              direction: "rtl", 
            },
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "20px", fontSize: "24px", color: "#003366" }}>
            تعديل سجل الطفل
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label>الاسم:</label>
            <input
              type="text"
              name="name"
              value={currentChild?.name || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>الهوية:</label>
            <input
              type="number"
              name="id_number"
              value={currentChild?.id_number || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>تاريخ الميلاد:</label>
            <input
              type="date"
              name="birth_date"
              value={currentChild?.birth_date || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>العمر:</label>
            <input
              type="number"
              name="age"
              value={currentChild?.age !== undefined && currentChild?.age !== null ? Math.floor(Number(currentChild.age)) : ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
              inputMode="numeric" 
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>الجوال:</label>
            <input
              type="text"
              name="phone"
              value={currentChild?.phone || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>الجنس:</label>
            <input
              type="text"
              name="gender"
              value={currentChild?.gender || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>نوع الاستفادة:</label>
            <input
              type="text"
              name="benefit_type"
              value={currentChild?.benefit_type || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>عدد مرات الاستفادة:</label>
            <input
              type="number"
              name="benefit_count"
              value={currentChild?.benefit_count || ""}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
              inputMode="numeric" 
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setEditModalOpen(false)}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveEdit}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              حفظ
            </button>
          </div>
        </Modal>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          ariaHideApp={false}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            },
            content: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              fontFamily: "Arial, sans-serif",
            },
          }}
        >
          <h3>حدد نوع المساعدة</h3>

          <select
            value={helpType}
            onChange={(e) => {
              setHelpType(e.target.value);
              setIsOtherSelected(e.target.value === "أخرى");
            }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">اختر نوع المساعدة</option>
            <option value="حليب">حليب</option>
            <option value="بامبرز">بامبرز</option>
            <option value="حليب + بامبرز">حليب + بامبرز</option>
            <option value="كسوة">كسوة</option>
            <option value="أخرى">أخرى</option>
          </select>

          {isOtherSelected && (
            <div style={{ marginTop: "20px" }}>
              <label>حدد نوع المساعدة الأخرى:</label>
              <input
                type="text"
                value={otherHelp}
                onChange={(e) => setOtherHelp(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                }}
              />
            </div>
          )}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              إلغاء
            </button>
        <button
          onClick={() => {
            const selectedHelp = isOtherSelected ? otherHelp : helpType;

            if (!selectedHelp || !helpChild) {
              toast.error("يرجى اختيار نوع المساعدة.");
              return;
            }

            const updatedChild = {
              ...helpChild,
              benefit_type: selectedHelp,
              benefit_count: (helpChild.benefit_count || 0) + 1,
            };

            axios
              .put(`https://al-furqan-project-xx60.onrender.com/api/children/${helpChild.id}`, updatedChild, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then(() => {
                toast.success("تم تحديث بيانات المساعدة بنجاح!");

                const updatedList = children.map((child) =>
                  child.id === helpChild.id ? updatedChild : child
                );
                setChildren(updatedList);
                setFiltered(updatedList);

                setHelpType("");
                setOtherHelp("");
                setIsOtherSelected(false);
                setIsModalOpen(false);
                setHelpChild(null);
              })
              .catch((error) => {
                console.error("خطأ أثناء تحديث المساعدة:", error);
                toast.error("فشل في تحديث بيانات الطفل!");
              });
          }}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          حفظ
        </button>
  </div>
</Modal>

<Modal
  isOpen={sortModal.open}
  onRequestClose={() => clearColumnFilter(sortModal.column)}
  ariaHideApp={false}
  style={{
    overlay: { backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: 1000 },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      width: "420px",
      background: "#fdfdfd",
      borderRadius: "12px",
      padding: "25px",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
      fontFamily: "Arial, sans-serif",
      direction: "rtl",
    },
  }}
>
  <h2 style={{ textAlign: "center", marginBottom: 20, color: "#003366" }}>
    فرز حسب: {getArabicColumnName(sortModal.column)}
  </h2>

  {["age", "benefit_count"].includes(sortModal.column) && (
    <>
      <label style={{ fontWeight: "bold" }}>الشرط:</label>
      <select
        value={sortOperator}
        onChange={(e) => setSortOperator(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "5px",
          marginBottom: "10px",
        }}
      >
        <option value="">اختر الشرط</option>
        <option value=">">أكبر من</option>
        <option value="<">أصغر من</option>
        <option value="=">يساوي</option>
      </select>

      <label style={{ fontWeight: "bold", marginTop: 10 }}>القيمة:</label>
      <input
        type="number"
        value={sortValue}
        onChange={(e) => setSortValue(e.target.value)}
        placeholder="أدخل الرقم"
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "5px",
        }}
      />
    </>
  )}

  {sortModal.column === "birth_date" && (
    <>
      <label style={{ fontWeight: "bold" }}>الشرط:</label>
      <select
        value={sortOperator}
        onChange={(e) => setSortOperator(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "5px",
          marginBottom: "10px",
        }}
      >
        <option value="">اختر الشرط</option>
        <option value=">">بعد</option>
        <option value="<">قبل</option>
        <option value="=">يساوي</option>
      </select>

      <label style={{ fontWeight: "bold", marginTop: 10 }}>التاريخ:</label>
      <input
        type="date"
        value={sortValue}
        onChange={(e) => setSortValue(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "5px",
        }}
      />
    </>
  )}

  {sortModal.column === "benefit_type" && (
    <>
      <label style={{ fontWeight: "bold" }}>نوع المساعدة:</label>
      <select
        value={sortValue}
        onChange={(e) => setSortValue(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "5px",
        }}
      >
        <option value="">اختر النوع</option>
        {[...new Set(children.map((c) => c.benefit_type))].map((type, i) => (
          <option key={i} value={type}>{type}</option>
        ))}
      </select>
    </>
  )}

  <div style={{ marginTop: 25, display: "flex", justifyContent: "space-between" }}>
    <button
      onClick={() => clearColumnFilter(sortModal.column)}
      style={{
        backgroundColor: "#f44336",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      إلغاء
    </button>
    <button
      onClick={applySort}
      style={{
        backgroundColor: "#4CAF50",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      تطبيق
    </button>
  </div>
</Modal>         
      <ToastContainer />
    </div>
  );
};

export default ChildRegistration;
