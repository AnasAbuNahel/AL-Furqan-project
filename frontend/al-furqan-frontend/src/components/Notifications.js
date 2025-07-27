import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlusCircle,
  FaEdit,
  FaTrashAlt,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";

const actionIcons = {
  إضافة: <FaPlusCircle className="text-green-500" />,
  تعديل: <FaEdit className="text-yellow-500" />,
  حذف: <FaTrashAlt className="text-red-500" />,
};

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (someDate) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    someDate.getDate() === yesterday.getDate() &&
    someDate.getMonth() === yesterday.getMonth() &&
    someDate.getFullYear() === yesterday.getFullYear()
  );
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date))
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  else if (isYesterday(date))
    return "أمس " + date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  else
    return (
      date.toLocaleDateString("ar-EG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " - " +
      date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    );
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://al-furqan-project-xx60.onrender.com/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("خطأ في جلب الإشعارات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // تصفير عداد الإشعارات عند فتح الصفحة
    localStorage.setItem("notificationCount", "0");
  }, []);

  const groupedNotifications = {
    اليوم: [],
    "أمس": [],
    "أقدم": [],
  };

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.timestamp);
    if (isToday(notifDate)) groupedNotifications["اليوم"].push(notif);
    else if (isYesterday(notifDate)) groupedNotifications["أمس"].push(notif);
    else groupedNotifications["أقدم"].push(notif);
  });

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-tr from-blue-50 via-indigo-100 to-purple-100 font-[Cairo] text-gray-800 flex flex-col px-10 py-14"
    >
      <h1 className="text-4xl sm:text-5xl font-black text-center mb-16 text-indigo-900 tracking-wide drop-shadow-md select-none">
        🛎️ سجل الإشعارات
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-14 h-14 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center text-gray-400 mt-32 select-none">
          <FaInfoCircle size={80} className="mb-6" />
          <p className="text-2xl font-semibold">لا توجد إشعارات حالياً.</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto space-y-16">
          {Object.entries(groupedNotifications).map(
            ([groupName, groupNotifs]) =>
              groupNotifs.length > 0 && (
                <section key={groupName} className="px-4 sm:px-8">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-5 border-b-2 border-indigo-300 pb-2 text-indigo-800 select-none pr-2 sm:pr-4">
                    {groupName}
                  </h2>
                  <div className="space-y-4 pr-2 sm:pr-4">
                    {groupNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-center gap-4 bg-white border ${
                          notif.isNew
                            ? "border-indigo-500 shadow-lg"
                            : "border-gray-200 shadow-sm"
                        } rounded-2xl pr-6 sm:pr-10 pl-2 sm:pl-4 py-4 hover:shadow-xl transition-shadow duration-300 cursor-pointer`}
                        title={`وقت الإشعار: ${new Date(
                          notif.timestamp
                        ).toLocaleString("ar-EG")}`}
                      >
                        <div className="text-3xl sm:text-4xl text-gray-500">
                          {actionIcons[notif.action] || <FaInfoCircle />}
                        </div>

                        <p className="flex-1 text-base sm:text-lg font-medium text-gray-800">
                          <span className="text-indigo-700 font-semibold">
                            {notif.username}
                          </span>{" "}
                          قام بـ{" "}
                          <span className="text-blue-600 font-bold">
                            {notif.action}
                          </span>{" "}
                          {notif.target_name && (
                            <>
                              {" "}
                              <span className="text-gray-700 font-medium">
                                {notif.target_name}
                              </span>
                            </>
                          )}
                        </p>

                        <div className="flex flex-col items-end min-w-[110px] text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaClock />
                            {formatDateTime(notif.timestamp)}
                          </span>
                          {notif.isNew && (
                            <span className="mt-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">
                              جديد
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
