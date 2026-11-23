import { useRef, useState } from "react";
import { usePopover, useAutoAlign, isMobile } from "../hooks.js";
import { SheetBackdrop, SheetHead } from "./Sheet.jsx";
import Icon from "./Icon.jsx";

// dropdown เลือกได้หลายค่า + มีช่องค้นหาข้างใน + แสดงจำนวนไฟล์ของแต่ละตัวเลือก
export default function MultiSelect({ label, icon, allLabel, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  usePopover(ref, open, setOpen);
  const align = useAutoAlign(ref, open, 300);

  const sel = new Set(value);
  const merged = [...options];
  for (const v of value) if (!options.some(([o]) => o === v)) merged.push([v, 0]);
  const needle = q.trim().toLowerCase();
  const shown = merged.filter(([v]) => String(v).toLowerCase().includes(needle));
  const max = Math.max(1, ...merged.map(([, n]) => n));

  const toggle = (v) => onChange(sel.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  const text = !value.length ? allLabel : value.length === 1 ? value[0] : `${value[0]} +${value.length - 1}`;

  return (
    <div className="ms-wrap" ref={ref}>
      <div className="lab">{label}</div>
      <button type="button" className={"trigger" + (value.length ? " active" : "")} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name={icon} />
        <span className="tl" title={value.join(", ")}>{text}</span>
        {value.length > 1 && <span className="cnt">{value.length}</span>}
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>
      {open && (
        <>
        <SheetBackdrop onClose={() => setOpen(false)} />
        <div className={"pop " + align}>
          <SheetHead title={label} onClose={() => setOpen(false)} />
          <div className="pop-search">
            <Icon name="search" />
            <input autoFocus={!isMobile()} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`ค้นหา${label}…`} />
            {q && <button type="button" className="icon-btn" onClick={() => setQ("")} title="ล้างคำค้น"><Icon name="close" /></button>}
          </div>
          <div className="pop-actions">
            <button type="button" onClick={() => onChange([...new Set([...value, ...shown.map(([v]) => v)])])}>
              <Icon name="done_all" /> เลือกทั้งหมด{needle ? "ที่ค้นพบ" : ""}
            </button>
            <button type="button" onClick={() => onChange([])} disabled={!value.length}><Icon name="restart_alt" /> ล้าง</button>
          </div>
          <div className="pop-list">
            {shown.map(([v, n]) => (
              <label key={v} className={"opt" + (n ? "" : " zero")}>
                <input type="checkbox" checked={sel.has(v)} onChange={() => toggle(v)} />
                <span className="ol" title={v}>{v}</span>
                <span className="obar"><i style={{ width: `${(n / max) * 100}%` }} /></span>
                <span className="oc">{n.toLocaleString()}</span>
              </label>
            ))}
            {!shown.length && <div className="empty">ไม่พบ “{q}”</div>}
          </div>
          <div className="pop-foot">เลือก {value.length} จาก {merged.length} รายการ · ตัวเลข = จำนวนไฟล์</div>
        </div>
        </>
      )}
    </div>
  );
}
