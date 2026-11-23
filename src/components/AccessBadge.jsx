import Icon from "./Icon.jsx";

// ป้ายบอกว่าข้อมูลดึงผ่าน API ได้ หรือเป็นไฟล์ที่ต้องดาวน์โหลด
const INFO = {
  API: ["acc api", "api", "API", "ดึงข้อมูลผ่าน API ได้ (CKAN DataStore)"],
  "ไฟล์": ["acc file", "draft", "ไฟล์", "เป็นไฟล์ ต้องดาวน์โหลดไปเปิดเอง"],
  none: ["acc none", "block", "ไม่มีไฟล์", "ยังไม่มีไฟล์แนบ"],
};

export default function AccessBadge({ type }) {
  const [cls, icon, label, title] = INFO[type] || INFO.none;
  return <span className={cls} title={title}><Icon name={icon} />{label}</span>;
}
