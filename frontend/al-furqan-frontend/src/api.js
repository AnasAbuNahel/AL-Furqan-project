const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://al-furqan-project-82pm.onrender.com";

export default API_BASE_URL;



