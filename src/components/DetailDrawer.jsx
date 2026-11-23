import { useEffect, useMemo, useRef, useState } from "react";
import DualRing from "./DualRing.jsx";
import Icon from "./Icon.jsx";
import AccessBadge from "./AccessBadge.jsx";
import { dsStatus } from "./EntityCard.jsx";
import { exportRows } from "../api.js";
import { requiredYears, pct } from "../stats.js";

const FILTERS = [
  ["", "ทั้งหมด"],
  ["nocur", "ยังไม่มีปีปัจจุบัน"],
  ["fail", "ไม่ผ่าน"],
  ["pass", "ผ่านครบ"],
];

// แผงรายละเอียดของการ์ด: รายชุดข้อมูลพร้อมแถบปี เหตุผล และส่งออก CSV
export default function DetailDrawer({ row, meta, cfg, byOrg, onClose }) {
  const ref = useRef(null);
  const [f, setF] = useState("");
  const req = requiredYears(cfg.cur, cfg.n);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  const list = useMemo(() => row.items
    .filter((d) => !f || (f === "nocur" ? !d.c2 : f === "fail" ? !d.pass : d.pass))
    .sort((a, b) => Number(a.pass) - Number(b.pass) || Number(a.c2) - Number(b.c2) || a.title.localeCompare(b.title, "th")), [row, f]);

  const yn = (b) => (b ? "ผ่าน" : "ไม่ผ่าน");
  const doExport = () => exportRows(`ติดตามข้อมูล_${meta.title}.csv`,
    ["ชุดข้อมูล", "หน่วยงาน", `มีปี ${cfg.cur}`, `ย้อนหลังครบ ${req[0]}–${req[req.length - 1]}`, "Machine readable", "ผลรวม", "เหตุผล", "API / ไฟล์", "ลิงก์"],
    list.map((d) => [d.title, d.org, yn(d.c2), yn(d.c1), yn(d.c3), yn(d.pass), d.reasons.join("; "), d.access === "none" ? "ไม่มีไฟล์" : d.access, d.url]));

  return (
    <dialog ref={ref} className="drawer" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }} aria-labelledby="drawer-title">
      <div className="drawer-in">
        <header className="drawer-head">
          <DualRing outer={row.pCur} inner={row.pPass} size={76} label={meta.title} />
          <div>
            <h2 id="drawer-title">{meta.title}</h2>
            <p className="sub">
              <span className="amber-t">มีปี {cfg.cur} {row.cur}/{row.n} ({pct(row.cur, row.n)}%)</span> ·{" "}
              <span className="blue-t">ผ่านครบ {row.pass}/{row.n} ({pct(row.pass, row.n)}%)</span>
            </p>
          </div>
          <button type="button" className="icon-btn drawer-x" onClick={() => ref.current.close()} aria-label="ปิด"><Icon name="close" /></button>
        </header>
        <div className="drawer-tools">
          <div className="seg inline-seg" role="group" aria-label="กรองสถานะ">
            {FILTERS.map(([v, l]) => (
              <button key={v} type="button" className={f === v ? "on" : ""} aria-pressed={f === v} onClick={() => setF(v)}>{l}</button>
            ))}
          </div>
          <button type="button" className="btn" onClick={doExport} disabled={!list.length}><Icon name="download" /> ส่งออก CSV</button>
        </div>
        <ol className="drawer-list">
          {list.map((d) => {
            const [k, l] = dsStatus(d, cfg.cur);
            return (
              <li key={d.id}>
                <div className="dl-top">
                  <a href={d.url} target="_blank" rel="noopener">{d.title}</a>
                  <span className={"st " + k}>{l}</span>
                </div>
                {!byOrg && <p className="sub">{d.org}</p>}
                <div className="dl-row">
                  <div className="ystrip" aria-label={`ปีที่มีข้อมูล ${[...d.ys].sort().join(", ") || "ไม่มี"}`}>
                    {req.map((y) => (
                      <span key={y} className={"yb " + (d.ys.has(y) ? "has" : "miss")} title={`${y}: ${d.ys.has(y) ? "มีข้อมูล" : "ไม่มีข้อมูล"}`}>{String(y).slice(2)}</span>
                    ))}
                  </div>
                  <AccessBadge type={d.access} />
                </div>
                {!d.pass && <p className="reason">{d.reasons.join(" · ")}</p>}
              </li>
            );
          })}
          {!list.length && <li className="status">ไม่มีชุดข้อมูลในสถานะนี้</li>}
        </ol>
      </div>
    </dialog>
  );
}
