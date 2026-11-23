import { forwardRef, useMemo, useRef, useState } from "react";
import EntityCard, { isProvincial } from "./EntityCard.jsx";
import Icon from "./Icon.jsx";
import { usePopover } from "../hooks.js";
import { SheetBackdrop, SheetHead } from "./Sheet.jsx";
import { ISSUES, OTHER, summarize } from "../stats.js";

// ตัวเลือกเรียง (ครบทั้งสองทิศทาง) — ค่า {cur} แทนด้วยปีปัจจุบันตอนแสดง
export const CARD_SORTS = [
  ["order", "ลำดับประเด็น", "issue"],
  ["need", "% ปี {cur} น้อย → มาก"],
  ["needR", "% ปี {cur} มาก → น้อย"],
  ["pass", "% ผ่านครบ น้อย → มาก"],
  ["passR", "% ผ่านครบ มาก → น้อย"],
  ["fails", "ชุดที่ไม่ผ่าน มาก → น้อย"],
  ["failsR", "ชุดที่ไม่ผ่าน น้อย → มาก"],
  ["size", "จำนวนชุด มาก → น้อย"],
  ["sizeR", "จำนวนชุด น้อย → มาก"],
  ["name", "ชื่อ ก → ฮ"],
  ["nameR", "ชื่อ ฮ → ก"],
];
// แสดงเฉพาะการ์ดที่ตรงเงื่อนไข (ตีวงแคบเพื่อติดตามงาน)
export const SHOWS = [
  ["", "ทั้งหมด", () => true],
  ["fail", "ยังมีชุดที่ไม่ผ่าน", (r) => r.pass < r.n],
  ["nocur", "ยังขาดข้อมูลปี {cur} บางชุด", (r) => r.cur < r.n],
  ["zero", "ยังไม่มีข้อมูลปี {cur} เลย", (r) => r.cur === 0],
  ["nofile", "มีชุดที่ไม่มีไฟล์แนบ", (r) => r.none > 0],
  ["done", "ผ่านครบทุกชุดแล้ว", (r) => r.n > 0 && r.pass === r.n],
];
const TIERS = [["", "ทุกระดับ"], ["prov", "ระดับจังหวัด"], ["central", "ส่วนกลาง/ภูมิภาค"]];
const ISSUE_ORDER = [...ISSUES, OTHER].map((i) => i.id);

// ตั้งค่าเงื่อนไข (ใช้ร่วมกับแท็บตรวจสอบ)
function CondSettings({ cfg, setCfg, custom, resetCfg }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  usePopover(ref, open, setOpen);
  return (
    <div className="ms-wrap cond" ref={ref}>
      <button type="button" className={"btn" + (custom ? " custom" : "")} onClick={() => setOpen((o) => !o)} aria-expanded={open}
        title={custom ? "ใช้เงื่อนไขที่ปรับเอง ไม่ใช่ค่ามาตรฐาน" : "เงื่อนไขการตรวจ"}>
        <Icon name="tune" /> <span className="cond-l">เงื่อนไข: </span>{cfg.n} ปี · {cfg.cur}
      </button>
      {open && (
        <>
        <SheetBackdrop onClose={() => setOpen(false)} />
        <div className="pop right cond-pop">
          <SheetHead title="เงื่อนไขการตรวจ" onClose={() => setOpen(false)} />
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
            นับปีเฉพาะไฟล์ MR (อ่านด้วยเครื่องได้)
          </label>
          {custom && <button type="button" className="btn cond-reset" onClick={resetCfg}><Icon name="restart_alt" /> คืนค่ามาตรฐาน (5 ปี · ปีปัจจุบัน)</button>}
          <p className="pop-foot">ผ่านเงื่อนไขครบ = ย้อนหลังครบ {cfg.n} ปี + มีปี {cfg.cur} + มีไฟล์ MR (ไฟล์ที่อ่านด้วยเครื่องได้ (CSV/Excel/JSON))</p>
        </div>
        </>
      )}
    </div>
  );
}

const Overview = forwardRef(function Overview({ datasets, cfg, setCfg, custom, resetCfg, view, setView, sort, setSort, show, setShow, tier, setTier, onOpen, onShare }, gridRef) {
  const sub = (t) => t.replace("{cur}", cfg.cur);
  const all = useMemo(() => summarize(datasets, view === "issue" ? "issue" : "org"), [datasets, view]);
  const tiered = useMemo(() => (view === "org" && tier ? all.filter((r) => (isProvincial(r.key) ? "prov" : "central") === tier) : all), [all, view, tier]);
  const counts = useMemo(() => Object.fromEntries(SHOWS.map(([k, , f]) => [k, tiered.filter(f).length])), [tiered]);
  const rows = useMemo(() => {
    const f = (SHOWS.find(([k]) => k === show) || SHOWS[0])[2];
    const by = {
      order: (a, b) => ISSUE_ORDER.indexOf(a.key) - ISSUE_ORDER.indexOf(b.key),
      need: (a, b) => a.pCur - b.pCur || a.pPass - b.pPass || b.n - a.n,
      needR: (a, b) => b.pCur - a.pCur || b.pPass - a.pPass,
      pass: (a, b) => a.pPass - b.pPass || a.pCur - b.pCur || b.n - a.n,
      passR: (a, b) => b.pPass - a.pPass || b.pCur - a.pCur,
      fails: (a, b) => (b.n - b.pass) - (a.n - a.pass) || a.pPass - b.pPass,
      failsR: (a, b) => (a.n - a.pass) - (b.n - b.pass) || b.pPass - a.pPass,
      size: (a, b) => b.n - a.n,
      sizeR: (a, b) => a.n - b.n,
      name: (a, b) => a.key.localeCompare(b.key, "th"),
      nameR: (a, b) => b.key.localeCompare(a.key, "th"),
    };
    // ประเด็นใช้ชื่อเต็มตอนเรียงตามชื่อ
    const title = (r) => (view === "issue" ? ([...ISSUES, OTHER].find((x) => x.id === r.key) || OTHER).title : r.key);
    const cmp = sort.startsWith("name")
      ? (a, b) => (sort === "nameR" ? -1 : 1) * title(a).localeCompare(title(b), "th")
      : by[sort] || by.need;
    return tiered.filter(f).sort(cmp);
  }, [tiered, show, sort, view]);

  const metaOf = (row) => {
    if (view === "issue") {
      const i = [...ISSUES, OTHER].find((x) => x.id === row.key) || OTHER;
      return { title: i.title, img: i.img, icon: i.icon };
    }
    return { title: row.key, icon: "apartment" };
  };
  const unit = view === "issue" ? "ประเด็น" : "หน่วยงาน";
  const narrowed = show || (view === "org" && tier);

  return (
    <section className="overview" aria-labelledby="ov-title">
      <div className="ov-bar">
        <h2 id="ov-title">{view === "issue" ? "ความพร้อมรายประเด็น" : "ความพร้อมรายหน่วยงาน"}</h2>
        <div className="ov-controls">
          <div className="seg inline-seg ov-view" role="group" aria-label="ดูตาม">
            <button type="button" className={view === "issue" ? "on" : ""} aria-pressed={view === "issue"}
              onClick={() => { setView("issue"); setSort("order"); }}><Icon name="category" /> ประเด็น</button>
            <button type="button" className={view === "org" ? "on" : ""} aria-pressed={view === "org"}
              onClick={() => { setView("org"); setSort("need"); }}><Icon name="apartment" /> หน่วยงาน</button>
          </div>
          <label className="sel-l ov-show"><span>แสดง</span>
            <select value={show} onChange={(e) => setShow(e.target.value)} className={show ? "active" : ""}>
              {SHOWS.map(([k, l]) => <option key={k} value={k}>{sub(l)} ({counts[k]})</option>)}
            </select>
          </label>
          {view === "org" && (
            <label className="sel-l ov-tier"><span>ระดับ</span>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={tier ? "active" : ""}>
                {TIERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          )}
          <label className="sel-l ov-sort"><span>เรียง</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {CARD_SORTS.filter(([, , only]) => !only || only === view).map(([k, l]) => <option key={k} value={k}>{sub(l)}</option>)}
            </select>
          </label>
          <CondSettings cfg={cfg} setCfg={setCfg} custom={custom} resetCfg={resetCfg} />
        </div>
      </div>
      <div className="ov-result">
        <p role="status">แสดง <b>{rows.length}</b> จาก {all.length} {unit}</p>
        {narrowed && (
          <button type="button" className="chip" onClick={() => { setShow(""); setTier(""); }}><Icon name="filter_alt_off" /> แสดงทั้งหมด</button>
        )}
        <button type="button" className="btn-link" onClick={onShare}><Icon name="link" /> คัดลอกลิงก์มุมมองนี้</button>
      </div>
      <ul className="ov-key" aria-label="คำอธิบายสัญลักษณ์">
        <li><span className="k amber" />วงนอก = มีข้อมูลปี {cfg.cur}</li>
        <li><span className="k blue" />วงใน = ผ่านเงื่อนไขครบ</li>
        <li><span className="k red" />ขอบแดง = ปี {cfg.cur} ไม่ถึง 25%</li>
      </ul>
      <div className="egrid" ref={gridRef}>
        {rows.map((row, i) => (
          <EntityCard key={row.key} row={row} meta={metaOf(row)} cur={cfg.cur} index={i} onOpen={() => onOpen(row, metaOf(row))} />
        ))}
        {!rows.length && (
          <div className="empty-big">
            <Icon name={show === "done" ? "hourglass_empty" : "task_alt"} />
            <p>{show === "done" ? `ยังไม่มี${unit}ที่ผ่านครบทุกชุด` : narrowed ? `ไม่มี${unit}ในกลุ่มนี้ — ดีแล้ว!` : "ไม่พบชุดข้อมูลที่ตรงกับตัวกรอง"}</p>
            {narrowed && <button type="button" className="btn" onClick={() => { setShow(""); setTier(""); }}>แสดงทั้งหมด</button>}
          </div>
        )}
      </div>
    </section>
  );
});

export default Overview;
