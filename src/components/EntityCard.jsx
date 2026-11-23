import DualRing from "./DualRing.jsx";
import Icon from "./Icon.jsx";

// สถานะสั้น ๆ ของชุดข้อมูล — สีไม่ใช่ช่องทางเดียว (มีข้อความกำกับเสมอ)
export function dsStatus(d, cur) {
  if (d.pass) return ["pass", "ผ่านครบ"];
  if (!d.files.length) return ["bad", "ไม่มีไฟล์"];
  if (!d.c2) return ["bad", `ไม่มีปี ${cur}`];
  if (!d.c1) return ["warn", "ย้อนหลังไม่ครบ"];
  return ["warn", "ไม่ใช่ Machine readable"];
}
const RANK = { bad: 0, warn: 1, pass: 2 };

const monogram = (name) => {
  const s = name.replace(/^(สำนักงาน|ที่ทำการ|กรม|การ|โครงการ)/, "").trim();
  return s.slice(0, 2);
};

// การ์ดหนึ่งใบ = หนึ่งประเด็นหรือหนึ่งหน่วยงาน
export default function EntityCard({ row, meta, cur, index, onOpen }) {
  const top = [...row.items]
    .map((d) => ({ d, s: dsStatus(d, cur) }))
    .sort((a, b) => RANK[a.s[0]] - RANK[b.s[0]] || a.d.title.localeCompare(b.d.title, "th"))
    .slice(0, 5);
  const need = row.pCur < 0.25;
  return (
    <article className={"ecard" + (need ? " need" : "")} style={{ "--i": Math.min(index, 12) }}>
      <header className="ecard-media">
        {meta.img ? <img src={meta.img} alt="" loading="lazy" /> : <span className="mono" aria-hidden="true">{monogram(row.key)}</span>}
        <span className="ecard-icon" aria-hidden="true"><Icon name={meta.icon} /></span>
      </header>
      <div className="ecard-head">
        <div>
          <h3><button type="button" onClick={onOpen}>{meta.title}</button></h3>
          <p className="ecard-meta">{row.n.toLocaleString()} ชุดข้อมูล
            {meta.sub && <> · {meta.sub}</>}
          </p>
        </div>
        <DualRing outer={row.pCur} inner={row.pPass} size={86} delay={Math.min(index, 12) * 55} label={meta.title} />
      </div>
      <dl className="ecard-nums">
        <div className="amber"><dt>ปี {cur}</dt><dd>{row.cur}<small>/{row.n}</small></dd></div>
        <div className="blue"><dt>ผ่านครบ</dt><dd>{row.pass}<small>/{row.n}</small></dd></div>
        <div><dt>API</dt><dd>{row.api}</dd></div>
        <div><dt>ไฟล์</dt><dd>{row.file}</dd></div>
        {row.none > 0 && <div className="red"><dt>ไม่มีไฟล์</dt><dd>{row.none}</dd></div>}
      </dl>
      <ul className="ecard-list">
        {top.map(({ d, s }) => (
          <li key={d.id}>
            <span className={"st " + s[0]}>{s[1]}</span>
            <span className="t" title={d.title}>{d.title}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="ecard-more" onClick={onOpen}>
        ดูทั้งหมด {row.n.toLocaleString()} ชุด <Icon name="arrow_forward" />
      </button>
    </article>
  );
}
