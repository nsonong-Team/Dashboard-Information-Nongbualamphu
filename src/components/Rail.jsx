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
        <img src="brand/emblem-nbl-statistics.png" alt="สถิติจังหวัดหนองบัวลำภู" width="447" height="447" />
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
        <p className="rl-time"><span className="pulse" aria-hidden="true" /><b>{time}</b></p>
        <p className="rl-state" role="status">{status.error ? "ดึงไม่สำเร็จ" : status.loading ? "กำลังดึง…" : "ดึงสดแล้ว"}</p>
        <button type="button" className="rl-reload" onClick={onReload} disabled={status.loading}>
          <Icon name="refresh" /> ดึงใหม่
        </button>
        <label className="rl-auto">
          <span>รีเฟรชอัตโนมัติ</span>
          <select value={autoMin} onChange={(e) => setAutoMin(+e.target.value)}>
            <option value={0}>ปิด</option>
            <option value={15}>ทุก 15 นาที</option>
            <option value={60}>ทุก 1 ชม.</option>
          </select>
        </label>
      </div>
    </nav>
  );
}
