import Icon from "./Icon.jsx";

const NAV = [
  ["overview", "dashboard", "ภาพรวม"],
  ["files", "folder_open", "ไฟล์ทั้งหมด"],
  ["check", "fact_check", "ตรวจสอบ"],
];

// แถบนำทางซ้าย (บนมือถือกลายเป็นแถบล่าง)
export default function Rail({ tab, setTab, status, onReload, autoMin, setAutoMin }) {
  const time = status.at ? status.at.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  return (
    <nav className="rail" aria-label="เมนูหลัก">
      <div className="rail-brand">
        <img src="brand/logo-nso-nongbualamphu.png" alt="สำนักงานสถิติจังหวัดหนองบัวลำภู" width="786" height="209" />
      </div>
      <ul className="rail-nav">
        {NAV.map(([id, icon, label]) => (
          <li key={id}>
            <button type="button" className={tab === id ? "on" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
              <Icon name={icon} fill={tab === id} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className={"rail-live" + (status.error ? " err" : status.loading ? " busy" : "")}>
        <span className="pulse" aria-hidden="true" />
        <b>{time}</b>
        <span className="rail-live-l">{status.error ? "ดึงไม่สำเร็จ" : status.loading ? "กำลังดึง…" : "ดึงสดแล้ว"}</span>
        <button type="button" className="icon-btn" onClick={onReload} disabled={status.loading} title="ดึงข้อมูลใหม่" aria-label="ดึงข้อมูลใหม่">
          <Icon name="refresh" />
        </button>
        <select value={autoMin} onChange={(e) => setAutoMin(+e.target.value)} aria-label="รีเฟรชอัตโนมัติ" title="รีเฟรชอัตโนมัติ">
          <option value={0}>อัตโนมัติ: ปิด</option>
          <option value={15}>ทุก 15 นาที</option>
          <option value={60}>ทุก 1 ชม.</option>
        </select>
      </div>
    </nav>
  );
}
