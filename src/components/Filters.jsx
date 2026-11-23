import { useEffect, useMemo, useState } from "react";
import { match } from "../api.js";
import MultiSelect from "./MultiSelect.jsx";
import YearPicker, { yearsSummary } from "./YearPicker.jsx";
import Icon from "./Icon.jsx";

function counts(list, fn) {
  const m = new Map();
  for (const f of list) for (const k of [].concat(fn(f))) m.set(k, (m.get(k) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}

const LABELS = { q: "ค้นหา", years: "ปี", org: "หน่วยงาน", group: "กลุ่ม", fmt: "รูปแบบ", freq: "ความถี่" };

// ตัวเลขในแต่ละตัวเลือกคำนวณจากตัวกรองอื่น ๆ ที่เลือกอยู่ (เช่น เลือกหน่วยงานแล้ว ตัวเลขปีจะเป็นของหน่วยงานนั้น)
export default function Filters({ files, filters, active, setF, reset, hide = [] }) {
  const [text, setText] = useState(filters.q);
  useEffect(() => { const t = setTimeout(() => setF({ q: text }), 250); return () => clearTimeout(t); }, [text]);
  useEffect(() => { if (filters.q === "" && text !== "") setText(""); }, [filters.q]);

  const opts = useMemo(() => {
    const base = (k) => files.filter((f) => match(f, active, [k, ...hide]));
    const yearBase = base("years");
    return {
      years: counts(yearBase, (f) => f.years),
      yearBase,
      org: counts(base("org"), (f) => f.org),
      group: counts(base("group"), (f) => f.groups),
      fmt: counts(base("fmt"), (f) => f.fmt),
      freq: counts(base("freq"), (f) => f.freq),
    };
  }, [files, active, hide.join()]);

  const totalFor = (ys) => opts.yearBase.filter((f) => f.years.some((y) => ys.includes(y))).length;

  const [expanded, setExpanded] = useState(false); // ใช้บนมือถือ: ซ่อน/แสดงตัวกรอง
  const chips = Object.entries(filters).filter(([k, v]) => v.length && !hide.includes(k));
  const nActive = chips.filter(([k]) => k !== "q").length;
  const chipText = (k, v) => (k === "q" ? v : k === "years" ? yearsSummary(v) : v.length > 2 ? `${v[0]} +${v.length - 1}` : v.join(", "));

  return (
    <div className="card">
      <div className={"filters" + (hide.length ? " narrow" : "") + (expanded ? "" : " collapsed")}>
        <div>
          <div className="lab">ค้นหา (ชื่อไฟล์ / ชุดข้อมูล / คำอธิบาย)</div>
          <div className="search-row">
            <div className="inline-search big">
              <Icon name="search" />
              <input type="search" enterKeyHint="search" placeholder="เช่น ขยะ, ข้าว, ประชากร" value={text} onChange={(e) => setText(e.target.value)} />
              {text && <button type="button" className="icon-btn" onClick={() => setText("")} title="ล้าง"><Icon name="close" /></button>}
            </div>
            <button type="button" className={"btn filter-toggle" + (nActive ? " active" : "")} onClick={() => setExpanded((x) => !x)} aria-expanded={expanded}>
              <Icon name="tune" /> ตัวกรอง{nActive ? ` (${nActive})` : ""}
              <Icon name={expanded ? "expand_less" : "expand_more"} />
            </button>
          </div>
        </div>
        {!hide.includes("years") && (
          <YearPicker options={opts.years} value={filters.years} onChange={(years) => setF({ years })} totalFor={totalFor} />
        )}
        <MultiSelect label="หน่วยงาน" icon="apartment" allLabel="ทุกหน่วยงาน" options={opts.org} value={filters.org} onChange={(org) => setF({ org })} />
        <MultiSelect label="กลุ่ม/ประเด็น" icon="category" allLabel="ทุกกลุ่ม" options={opts.group} value={filters.group} onChange={(group) => setF({ group })} />
        {!hide.includes("fmt") && (
          <MultiSelect label="รูปแบบไฟล์" icon="description" allLabel="ทุกรูปแบบ" options={opts.fmt} value={filters.fmt} onChange={(fmt) => setF({ fmt })} />
        )}
        <MultiSelect label="ความถี่การอัปเดต" icon="update" allLabel="ทุกความถี่" options={opts.freq} value={filters.freq} onChange={(freq) => setF({ freq })} />
      </div>
      {chips.length > 0 && (
        <div className="chips">
          {chips.map(([k, v]) => (
            <button key={k} className="chip" onClick={() => setF({ [k]: k === "q" ? "" : [] })} title={Array.isArray(v) ? v.join(", ") : v}>
              {LABELS[k]}: {chipText(k, v)} ✕
            </button>
          ))}
          <button className="chip" onClick={reset}><Icon name="filter_alt_off" /> ล้างตัวกรองทั้งหมด</button>
        </div>
      )}
    </div>
  );
}
