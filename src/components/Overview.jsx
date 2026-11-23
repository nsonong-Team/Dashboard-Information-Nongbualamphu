import { forwardRef, useMemo, useRef, useState } from "react";
import EntityCard from "./EntityCard.jsx";
import Icon from "./Icon.jsx";
import { usePopover } from "../hooks.js";
import { ISSUES, OTHER, summarize } from "../stats.js";

const SORTS = {
  order: "ลำดับประเด็น",
  need: "ต้องติดตามก่อน (% ปีปัจจุบันน้อยสุด)",
  ready: "พร้อมมากสุดก่อน",
  size: "จำนวนชุดข้อมูลมากสุด",
  name: "ชื่อ ก → ฮ",
};
const ISSUE_ORDER = [...ISSUES, OTHER].map((i) => i.id);

// ตั้งค่าเงื่อนไข (ใช้ร่วมกับแท็บตรวจสอบ)
function CondSettings({ cfg, setCfg }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  usePopover(ref, open, setOpen);
  return (
    <div className="ms-wrap cond" ref={ref}>
      <button type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="tune" /> เงื่อนไข: {cfg.n} ปี · ปี {cfg.cur}
      </button>
      {open && (
        <div className="pop right cond-pop">
          <label className="cond-row">ข้อมูลย้อนหลังครบ
            <select value={cfg.n} onChange={(e) => setCfg((c) => ({ ...c, n: +e.target.value }))}>
              {[3, 4, 5, 6, 10].map((x) => <option key={x} value={x}>{x} ปี</option>)}
            </select>
          </label>
          <label className="cond-row">ปีปัจจุบัน (พ.ศ.)
            <input type="number" min={2500} max={2700} value={cfg.cur} onChange={(e) => setCfg((c) => ({ ...c, cur: +e.target.value || c.cur }))} />
          </label>
          <label className="cond-row chk-row">
            <input type="checkbox" checked={cfg.mrOnly} onChange={(e) => setCfg((c) => ({ ...c, mrOnly: e.target.checked }))} />
            นับปีเฉพาะไฟล์ Machine readable
          </label>
          <p className="pop-foot">ผ่านเงื่อนไขครบ = ย้อนหลังครบ {cfg.n} ปี + มีปี {cfg.cur} + มีไฟล์ Machine readable</p>
        </div>
      )}
    </div>
  );
}

const Overview = forwardRef(function Overview({ datasets, cfg, setCfg, view, setView, sort, setSort, onOpen }, gridRef) {
  const rows = useMemo(() => {
    const r = summarize(datasets, view === "issue" ? "issue" : "org");
    const by = {
      order: (a, b) => ISSUE_ORDER.indexOf(a.key) - ISSUE_ORDER.indexOf(b.key),
      need: (a, b) => a.pCur - b.pCur || a.pPass - b.pPass || b.n - a.n,
      ready: (a, b) => b.pCur - a.pCur || b.pPass - a.pPass,
      size: (a, b) => b.n - a.n,
      name: (a, b) => a.key.localeCompare(b.key, "th"),
    }[sort] || ((a, b) => a.pCur - b.pCur);
    return r.sort(by);
  }, [datasets, view, sort]);

  const metaOf = (row) => {
    if (view === "issue") {
      const i = [...ISSUES, OTHER].find((x) => x.id === row.key) || OTHER;
      return { title: i.title, img: i.img, icon: i.icon };
    }
    return { title: row.key, icon: "apartment" };
  };

  return (
    <section className="overview" aria-labelledby="ov-title">
      <div className="ov-bar">
        <h2 id="ov-title">{view === "issue" ? "ความพร้อมรายประเด็น" : "ความพร้อมรายหน่วยงาน"} <span className="sub">{rows.length} {view === "issue" ? "ประเด็น" : "หน่วยงาน"}</span></h2>
        <div className="ov-controls">
          <div className="seg inline-seg" role="group" aria-label="ดูตาม">
            <button type="button" className={view === "issue" ? "on" : ""} aria-pressed={view === "issue"}
              onClick={() => { setView("issue"); setSort("order"); }}><Icon name="category" /> ประเด็น</button>
            <button type="button" className={view === "org" ? "on" : ""} aria-pressed={view === "org"}
              onClick={() => { setView("org"); setSort("need"); }}><Icon name="apartment" /> หน่วยงาน</button>
          </div>
          <label className="sort-sel"><Icon name="sort" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="เรียงการ์ด">
              {Object.entries(SORTS).filter(([k]) => view === "issue" || k !== "order").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <CondSettings cfg={cfg} setCfg={setCfg} />
        </div>
      </div>
      <p className="ov-key">
        <span className="k amber" /> วงนอก = มีข้อมูลปี {cfg.cur}
        <span className="k blue" /> วงใน = ผ่านเงื่อนไขครบ
        <span className="k red" /> ขอบแดง = มีข้อมูลปีปัจจุบันไม่ถึง 25%
      </p>
      <div className="egrid" ref={gridRef}>
        {rows.map((row, i) => (
          <EntityCard key={row.key} row={row} meta={metaOf(row)} cur={cfg.cur} index={i} onOpen={() => onOpen(row, metaOf(row))} />
        ))}
        {!rows.length && <div className="empty-big"><Icon name="search_off" /><p>ไม่พบชุดข้อมูลที่ตรงกับตัวกรอง</p></div>}
      </div>
    </section>
  );
});

export default Overview;
