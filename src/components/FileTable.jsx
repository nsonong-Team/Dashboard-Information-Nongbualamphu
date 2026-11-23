import { useEffect, useState } from "react";
import { yearLabel, thDate } from "../api.js";
import Icon from "./Icon.jsx";
import AccessBadge from "./AccessBadge.jsx";

const PAGE = 60;
const COLS = [
  ["name", "ชื่อไฟล์"],
  ["org", "หน่วยงาน"],
  ["year", "ปีข้อมูล"],
  ["fmt", "รูปแบบ"],
  ["mod", "อัปเดต"],
];
// ตัวเลือกเรียงลำดับสำหรับมือถือ (บนมือถือไม่มีหัวตารางให้คลิก)
const SORTS = [
  ["mod:-1", "อัปเดตล่าสุด"],
  ["year:-1", "ปีข้อมูล ใหม่ → เก่า"],
  ["year:1", "ปีข้อมูล เก่า → ใหม่"],
  ["name:1", "ชื่อไฟล์ ก → ฮ"],
  ["org:1", "หน่วยงาน ก → ฮ"],
  ["fmt:1", "รูปแบบไฟล์"],
];

export default function FileTable({ view, sort, setSort, onPreview }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [view]);

  const clickSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === "mod" || key === "year" ? -1 : 1 }));

  return (
    <>
      <div className="m-sort mobile-only">
        <Icon name="sort" />
        <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(":"); setSort({ key, dir: +dir }); }}>
          {!SORTS.some(([v]) => v === `${sort.key}:${sort.dir}`) && <option value={`${sort.key}:${sort.dir}`}>กำหนดเอง</option>}
          {SORTS.map(([v, l]) => <option key={v} value={v}>เรียงตาม: {l}</option>)}
        </select>
      </div>
      <div className="tw">
        <table className="cards ftable">
          <thead>
            <tr>
              {COLS.map(([k, l]) => (
                <th key={k} onClick={() => clickSort(k)}>{l}{sort.key === k ? (sort.dir > 0 ? " ▲" : " ▼") : ""}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {!view.length ? (
              <tr><td colSpan={6} className="status">ไม่พบไฟล์ที่ตรงกับตัวกรอง</td></tr>
            ) : view.slice(0, shown).map((f) => (
              <tr key={f.id}>
                <td className="c-name">
                  <div className="fname">{f.name}</div>
                  <div className="sub"><a href={f.dsUrl} target="_blank" rel="noopener">{f.ds}</a></div>
                </td>
                <td className="ds c-org"><Icon name="apartment" className="mobile-only" /> {f.org}</td>
                <td className="nowrap c-year"><Icon name="calendar_month" className="mobile-only" /> {yearLabel(f.years)}</td>
                <td className="c-fmt"><span className="tagrow"><span className={"fmt " + f.fmt}>{f.fmt}</span><AccessBadge type={f.access} /></span></td>
                <td className="ds nowrap c-date"><Icon name="update" className="mobile-only" /> {thDate(f.mod)}</td>
                <td className="acts c-act">
                  <a href={f.url} target="_blank" rel="noopener"><Icon name="download" /> ดาวน์โหลด</a>
                  <a href={f.page} target="_blank" rel="noopener"><Icon name="open_in_new" /> หน้าเว็บ</a>
                  {f.datastore && <button onClick={() => onPreview(f)}><Icon name="table_view" /> ดูตัวอย่าง</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < view.length && (
        <div className="more">
          <button className="btn" onClick={() => setShown((n) => n + PAGE)}>แสดงเพิ่ม (เหลืออีก {(view.length - shown).toLocaleString()})</button>
        </div>
      )}
    </>
  );
}
