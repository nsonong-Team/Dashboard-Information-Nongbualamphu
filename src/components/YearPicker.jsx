import { useRef, useState } from "react";
import { usePopover, useAutoAlign, isMobile } from "../hooks.js";
import { SheetBackdrop, SheetHead } from "./Sheet.jsx";
import { CUR_Y } from "../api.js";
import Icon from "./Icon.jsx";

const range = (a, b) => { if (a > b) [a, b] = [b, a]; const o = []; for (let y = a; y <= b; y++) o.push(y); return o; };
const isRange = (s) => s.length > 1 && s.every((y, i) => i === 0 || y === s[i - 1] + 1);

export function yearsSummary(ys) {
  if (!ys.length) return "ทุกปี";
  const s = [...ys].sort((a, b) => a - b);
  if (s.length === 1) return String(s[0]);
  if (isRange(s)) return `${s[0]}–${s[s.length - 1]} (${s.length} ปี)`;
  return s.length <= 3 ? s.join(", ") : `${s.slice(0, 2).join(", ")} +${s.length - 2} ปี`;
}

// เลือกปี: โหมด "รายปี" (ติ๊กหลายปี) หรือ "ช่วงปี" (ตั้งแต่…ถึง…) พร้อมจำนวนไฟล์ของแต่ละปี
// options = [[ปี, จำนวนไฟล์]], totalFor(ปี[]) = จำนวนไฟล์ที่มีข้อมูลอย่างน้อย 1 ปีในชุดที่เลือก
export default function YearPicker({ options, value, onChange, totalFor }) {
  const [open, setOpen] = useState(false);
  const sortedVal = [...value].sort((a, b) => a - b);
  const [mode, setMode] = useState(isRange(sortedVal) ? "range" : "list");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(isRange(sortedVal) ? sortedVal[0] : CUR_Y - 4);
  const [to, setTo] = useState(isRange(sortedVal) ? sortedVal[sortedVal.length - 1] : CUR_Y);
  const ref = useRef(null);
  usePopover(ref, open, setOpen);
  const align = useAutoAlign(ref, open, 340);

  const cnt = new Map(options);
  const years = options.map(([y]) => y).sort((a, b) => b - a);
  const max = Math.max(1, ...options.map(([, n]) => n));
  const sel = new Set(value);
  const toggle = (y) => onChange(sel.has(y) ? value.filter((x) => x !== y) : [...value, y]);
  const quick = (n) => { const r = range(CUR_Y - n + 1, CUR_Y); setFrom(r[0]); setTo(CUR_Y); onChange(r); };
  const rangeYs = range(from, to);
  const listShown = years.filter((y) => String(y).includes(q.trim()));

  const Row = ({ y, check }) => (
    <label className={"opt" + (cnt.get(y) ? "" : " zero") + (y === CUR_Y ? " cur" : "")}>
      {check && <input type="checkbox" checked={sel.has(y)} onChange={() => toggle(y)} />}
      <span className="ol">{y}{y === CUR_Y && <em> ปีปัจจุบัน</em>}</span>
      <span className="obar"><i style={{ width: `${((cnt.get(y) || 0) / max) * 100}%` }} /></span>
      <span className="oc">{(cnt.get(y) || 0).toLocaleString()}</span>
    </label>
  );

  return (
    <div className="ms-wrap" ref={ref}>
      <div className="lab">ปี (พ.ศ.)</div>
      <button type="button" className={"trigger" + (value.length ? " active" : "")} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="calendar_month" />
        <span className="tl">{yearsSummary(value)}</span>
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>
      {open && (
        <>
        <SheetBackdrop onClose={() => setOpen(false)} />
        <div className={"pop wide " + align}>
          <SheetHead title="ปี (พ.ศ.)" onClose={() => setOpen(false)} />
          <div className="seg">
            <button type="button" className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}><Icon name="checklist" /> เลือกรายปี</button>
            <button type="button" className={mode === "range" ? "on" : ""} onClick={() => setMode("range")}><Icon name="date_range" /> ช่วงปี</button>
          </div>
          <div className="pop-actions">
            {[3, 5, 10].map((n) => (
              <button type="button" key={n} onClick={() => quick(n)}><Icon name="history" /> {n} ปีล่าสุด</button>
            ))}
            <button type="button" onClick={() => onChange([])} disabled={!value.length}><Icon name="restart_alt" /> ล้าง</button>
          </div>

          {mode === "list" ? (
            <>
              <div className="pop-search">
                <Icon name="search" />
                <input autoFocus={!isMobile()} value={q} onChange={(e) => setQ(e.target.value)} placeholder="พิมพ์ปี เช่น 2567" inputMode="numeric" />
              </div>
              <div className="pop-list">
                {listShown.map((y) => <Row key={y} y={y} check />)}
                {!listShown.length && <div className="empty">ไม่พบปี “{q}”</div>}
              </div>
            </>
          ) : (
            <>
              <div className="range-row">
                <div>
                  <div className="lab">ตั้งแต่ปี</div>
                  <select value={from} onChange={(e) => setFrom(+e.target.value)}>
                    {years.map((y) => <option key={y} value={y}>{y} ({cnt.get(y) || 0} ไฟล์)</option>)}
                  </select>
                </div>
                <Icon name="arrow_forward" />
                <div>
                  <div className="lab">ถึงปี</div>
                  <select value={to} onChange={(e) => setTo(+e.target.value)}>
                    {years.map((y) => <option key={y} value={y}>{y} ({cnt.get(y) || 0} ไฟล์)</option>)}
                  </select>
                </div>
              </div>
              <div className="pop-list">
                {[...rangeYs].reverse().map((y) => <Row key={y} y={y} />)}
              </div>
              <div className="pop-actions">
                <button type="button" className="primary" onClick={() => { onChange(rangeYs); setOpen(false); }}>
                  <Icon name="check" /> ใช้ช่วง {Math.min(from, to)}–{Math.max(from, to)} ({totalFor(rangeYs).toLocaleString()} ไฟล์)
                </button>
              </div>
            </>
          )}
          <div className="pop-foot">
            {value.length
              ? <>เลือก {yearsSummary(value)} · รวม <b>{totalFor(value).toLocaleString()}</b> ไฟล์ (ไฟล์ที่ครอบคลุมหลายปีนับครั้งเดียว)</>
              : "ตัวเลข = จำนวนไฟล์ที่มีข้อมูลของปีนั้น"}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
