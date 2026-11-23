import { useEffect, useMemo, useRef, useState } from "react";
import DualRing from "./DualRing.jsx";
import Icon from "./Icon.jsx";
import AccessBadge from "./AccessBadge.jsx";
import { dsStatus } from "./EntityCard.jsx";
import { exportRows } from "../api.js";
import { requiredYears, pct } from "../stats.js";

const DSORTS = [
  ["fail", "ไม่ผ่านก่อน"],
  ["az", "ชื่อ ก → ฮ"],
  ["za", "ชื่อ ฮ → ก"],
  ["org", "หน่วยงาน ก → ฮ"],
  ["orgR", "หน่วยงาน ฮ → ก"],
  ["latest", "ปีล่าสุด เก่า → ใหม่"],
];
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
  const [q, setQ] = useState("");
  const [ds, setDs] = useState("fail");
  const req = requiredYears(cfg.cur, cfg.n);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const th = (a, b) => a.localeCompare(b, "th");
    const cmp = {
      fail: (a, b) => Number(a.pass) - Number(b.pass) || Number(a.c2) - Number(b.c2) || th(a.title, b.title),
      az: (a, b) => th(a.title, b.title),
      za: (a, b) => th(b.title, a.title),
      org: (a, b) => th(a.org, b.org) || th(a.title, b.title),
      orgR: (a, b) => th(b.org, a.org) || th(a.title, b.title),
      latest: (a, b) => (a.latest || 0) - (b.latest || 0) || th(a.title, b.title),
    }[ds];
    return row.items
      .filter((d) => !f || (f === "nocur" ? !d.c2 : f === "fail" ? !d.pass : d.pass))
      .filter((d) => !needle || d.title.toLowerCase().includes(needle) || d.org.toLowerCase().includes(needle))
      .sort(cmp);
  }, [row, f, q, ds]);
  const count = (k) => row.items.filter((d) => !k || (k === "nocur" ? !d.c2 : k === "fail" ? !d.pass : d.pass)).length;

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
              <button key={v} type="button" className={f === v ? "on" : ""} aria-pressed={f === v} onClick={() => setF(v)}>{l} <small>{count(v)}</small></button>
            ))}
          </div>
          <button type="button" className="btn" onClick={doExport} disabled={!list.length}><Icon name="download" /> ส่งออก CSV ({list.length})</button>
        </div>
        <div className="drawer-find">
          <div className="inline-search">
            <Icon name="search" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={byOrg ? "ค้นหาชื่อชุดข้อมูล" : "ค้นหาชุดข้อมูลหรือหน่วยงาน"} aria-label="ค้นหาในรายการ" />
          </div>
          <select value={ds} onChange={(e) => setDs(e.target.value)} aria-label="เรียงรายการ">
            {DSORTS.filter(([k]) => !byOrg || !k.startsWith("org")).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
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
          {!list.length && <li className="status">{q ? `ไม่พบ “${q}”` : "ไม่มีชุดข้อมูลในสถานะนี้"}</li>}
        </ol>
      </div>
    </dialog>
  );
}
