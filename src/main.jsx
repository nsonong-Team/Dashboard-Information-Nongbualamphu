import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// ฟอนต์ self-host (ไม่พึ่ง Google ตอนใช้งาน): Chakra Petch = หัวข้อ/ตัวเลข, Anuphan = เนื้อหา
import "@fontsource/chakra-petch/thai-500.css";
import "@fontsource/chakra-petch/thai-600.css";
import "@fontsource/chakra-petch/thai-700.css";
import "@fontsource/chakra-petch/latin-500.css";
import "@fontsource/chakra-petch/latin-600.css";
import "@fontsource/chakra-petch/latin-700.css";
import "@fontsource/anuphan/thai-400.css";
import "@fontsource/anuphan/thai-500.css";
import "@fontsource/anuphan/thai-600.css";
import "@fontsource/anuphan/latin-400.css";
import "@fontsource/anuphan/latin-500.css";
import "@fontsource/anuphan/latin-600.css";
import "./styles.css";
import "./components.css";
import "./mobile.css";
import "./world.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
