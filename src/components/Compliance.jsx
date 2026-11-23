import { useEffect, useMemo, useState } from "react";
import { CUR_Y, MR_FORMATS, exportRows } from "../api.js";
import { evaluate, NO_GROUP, requiredYears } from "../stats.js";
import Icon from "./Icon.jsx";
import AccessBadge from "./AccessBadge.jsx";

const PAGE = 60;
const STATUS = [
  ["", "ทุกสถานะ"],
  ["pass", "ผ่านครบทุกเงื่อนไข"],
  ["fail", "ไม่ผ่านอย่างน้อย 1 ข้อ"],
  ["c1", "ข้อมูลย้อนหลังไม่ครบ"],
  ["c2", "ไม่มีข้อมูลปีปัจจุบัน"],
  ["c3", "ไม่มีไฟล์ Machine readable"],
  ["nofile", "ไม่มีไฟล์แนบ"],
  ["api", "มี API"],
  ["fileonly", "เป็นไฟล์อย่างเดียว (ไม่มี API)"],
];
const BY = { org: ["หน่วยงาน", "apartment"], group: ["ประเด็น (กลุ่ม)", "category"] };

const LSORTS = [
  ["org", "หน่วยงาน ก → ฮ"],
  ["orgR", "หน่วยงาน ฮ → ก"],
  ["az", "ชื่อชุดข้อมูล ก → ฮ"],
  ["za", "ชื่อชุดข้อมูล ฮ → ก"],
  ["fail", "ไม่ผ่านก่อน"],
  ["latest", "ปีล่าสุด เก่า → ใหม่"],
];

const Check = ({ ok, title }) => (
  <span className={"chk " + (ok ? "ok" : "bad")} title={title}><Icon name={ok ? "check_circle" : "cancel"} fill /></span>
);

// ตรวจสอบชุดข้อมูลตามเงื่อนไข: (1) ย้อนหลังครบ N ปี (2) มีปีปัจจุบัน (3) Machine readable (4) สรุปรายหน่วยงาน (5) ส่งออกผลตรวจ
// emptyDatasets = ชุดข้อมูลที่ยังไม่มีไฟล์แนบ (นับเป็นไม่ผ่านทุกข้อ)
// cfg = { cur, n, mrOnly } ใช้ร่วมกับหน้าการ์ด (ตั้งค่าที่เดียว)
export default function Compliance({ files, emptyDatasets = [], cfg, setCfg }) {
  const { cur, n, mrOnly } = cfg;
  const setCur = (cur) => setCfg((c) => ({ ...c, cur }));
  const setN = (n) => setCfg((c) => ({ ...c, n }));
  const setMrOnly = (mrOnly) => setCfg((c) => ({ ...c, mrOnly }));
  const [by, setBy] = useState("org"); // สรุปตาม หน่วยงาน หรือ ประเด็น
  const [pick, setPick] = useState(""); // แถวที่คลิกเลือกในตารางสรุป
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [lsort, setLsort] = useState("org");
  const [shown, setShown] = useState(PAGE);
  const [orgSort, setOrgSort] = useState({ key: "pct", dir: 1 });

  const required = useMemo(() => requiredYears(cur, n), [cur, n]);

  const datasets = useMemo(() => evaluate(files, emptyDatasets, cfg), [files, emptyDatasets, cfg]);

  const orgRows = useMemo(() => {
    const m = new Map();
    for (const d of datasets) for (const k of d.keys[by]) {
      const r = m.get(k) || { org: k, n: 0, api: 0, file: 0, c1: 0, c2: 0, c3: 0, pass: 0 };
      r.n++; r.api += d.access === "API"; r.file += d.access === "ไฟล์";
      r.c1 += d.c1; r.c2 += d.c2; r.c3 += d.c3; r.pass += d.pass;
      m.set(k, r);
    }
    const rows = [...m.values()].map((r) => ({ ...r, pct: r.pass / r.n }));
    const { key, dir } = orgSort;
    return rows.sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === "string" ? x.localeCompare(y, "th") : x - y;
      return c * dir || b.n - a.n;
    });
  }, [datasets, orgSort, by]);

  const total = useMemo(() => ({
    n: datasets.length,
    pass: datasets.filter((d) => d.pass).length,
    c1: datasets.filter((d) => d.c1).length,
    c2: datasets.filter((d) => d.c2).length,
    c3: datasets.filter((d) => d.c3).length,
    api: datasets.filter((d) => d.access === "API").length,
    file: datasets.filter((d) => d.access === "ไฟล์").length,
  }), [datasets]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const th = (a, b) => a.localeCompare(b, "th");
    const cmp = {
      org: (a, b) => th(a.org, b.org) || th(a.title, b.title),
      orgR: (a, b) => th(b.org, a.org) || th(a.title, b.title),
      az: (a, b) => th(a.title, b.title),
      za: (a, b) => th(b.title, a.title),
      fail: (a, b) => Number(a.pass) - Number(b.pass) || Number(a.c2) - Number(b.c2) || th(a.org, b.org),
      latest: (a, b) => (a.latest || 0) - (b.latest || 0) || th(a.title, b.title),
    }[lsort];
    return datasets.filter((d) =>
      (!pick || d.keys[by].includes(pick)) &&
      (!needle || d.title.toLowerCase().includes(needle) || d.org.toLowerCase().includes(needle)) &&
      (!status || (status === "pass" ? d.pass : status === "fail" ? !d.pass : status === "nofile" ? !d.files.length : status === "api" ? d.access === "API" : status === "fileonly" ? d.access === "ไฟล์" : !d[status]))
    ).sort(cmp);
  }, [datasets, pick, by, status, q, lsort]);
  useEffect(() => setShown(PAGE), [list]);

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const sortOrg = (key) => setOrgSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === "org" ? 1 : -1 }));
  const arrow = (key) => (orgSort.key === key ? (orgSort.dir > 0 ? " ▲" : " ▼") : "");
  const yn = (b) => (b ? "ผ่าน" : "ไม่ผ่าน");
  const span = `${required[0]}–${required[required.length - 1]}`;

  const exportOrgs = () => exportRows(`ผลตรวจราย${BY[by][0]}_${span}.csv`,
    [BY[by][0], "ชุดข้อมูล", "มี API", "ไฟล์อย่างเดียว", `ย้อนหลังครบ ${span}`, `มีปี ${cur}`, "Machine readable", "ผ่านครบ", "% ผ่าน"],
    orgRows.map((r) => [r.org, r.n, r.api, r.file, r.c1, r.c2, r.c3, r.pass, pct(r.pass, r.n)]));
  const exportList = () => exportRows(`ผลตรวจรายชุดข้อมูล_${span}.csv`,
    ["หน่วยงาน", "ประเด็น (กลุ่ม)", "ชุดข้อมูล", "API / ไฟล์", "ปีที่มีข้อมูล", "ปีที่ขาด", `ย้อนหลังครบ ${span}`, `มีปี ${cur}`, "Machine readable", "รูปแบบไฟล์", "ผลรวม", "เหตุผล", "ลิงก์"],
    list.map((d) => [d.org, d.groups.join(" / "), d.title, d.access === "none" ? "ไม่มีไฟล์" : d.access, [...d.ys].sort().join(" "), d.missing.join(" "), yn(d.c1), yn(d.c2), yn(d.c3), d.fmts.join(" "), yn(d.pass), d.reasons.join("; "), d.url]));

  return (
    <>
      <div className="card">
        <h2><Icon name="rule" /> เงื่อนไขการตรวจสอบ</h2>
        <div className="crit">
          <div className="crit-i"><b>1</b> ข้อมูลย้อนหลังครบ
            <select value={n} onChange={(e) => setN(+e.target.value)} className="inline">
              {[3, 4, 5, 6, 10].map((x) => <option key={x} value={x}>{x} ปี</option>)}
            </select>
            <span className="sub">({span})</span>
          </div>
          <div className="crit-i"><b>2</b> มีข้อมูลปีปัจจุบัน
            <input type="number" className="inline num" value={cur} min={2500} max={2700} onChange={(e) => setCur(+e.target.value || CUR_Y)} />
          </div>
          <div className="crit-i"><b>3</b> มีไฟล์ Machine readable
            <span className="sub" title="PDF, HTML, DOCX, รูปภาพ, RAR ไม่นับ">({[...MR_FORMATS].join(", ")})</span>
          </div>
          <label className="crit-i toggle">
            <input type="checkbox" checked={mrOnly} onChange={(e) => setMrOnly(e.target.checked)} />
            นับปีเฉพาะจากไฟล์ Machine readable (เข้มงวดกว่า)
          </label>
        </div>
      </div>

      <div className="kpis">
        <Kpi icon="dataset" v={total.n} l="ชุดข้อมูลที่ตรวจ" />
        <Kpi icon="verified" tone="ok" v={total.pass} l={`ผ่านครบทุกข้อ (${pct(total.pass, total.n)}%)`} />
        <Kpi icon="history" v={total.c1} l={`ย้อนหลังครบ ${span} (${pct(total.c1, total.n)}%)`} />
        <Kpi icon="event_available" v={total.c2} l={`มีข้อมูลปี ${cur} (${pct(total.c2, total.n)}%)`} />
        <Kpi icon="table_view" v={total.c3} l={`Machine readable (${pct(total.c3, total.n)}%)`} />
        <Kpi icon="api" v={total.api} l={`มี API (${pct(total.api, total.n)}%) · ไฟล์อย่างเดียว ${total.file}`} />
      </div>

      <div className="card">
        <div className="tablebar">
          <h2 style={{ margin: 0 }}><Icon name={BY[by][1]} /> สรุปตาม{BY[by][0]} <span className="sub">(คลิกแถวเพื่อดูรายชุดข้อมูล{by === "group" ? " · ชุดที่อยู่หลายประเด็นจะนับในทุกประเด็น" : ""})</span></h2>
          <div className="row">
            <div className="seg inline-seg">
              {Object.entries(BY).map(([k, [l, ic]]) => (
                <button key={k} type="button" className={by === k ? "on" : ""} onClick={() => { setBy(k); setPick(""); }}><Icon name={ic} /> {l}</button>
              ))}
            </div>
            <button className="btn" onClick={exportOrgs}><Icon name="download" /> ส่งออก CSV</button>
          </div>
        </div>
        <div className="tw">
          <table className="orgt cards">
            <thead>
              <tr>
                <th onClick={() => sortOrg("org")}>{BY[by][0]}{arrow("org")}</th>
                <th className="r" onClick={() => sortOrg("n")}>ชุดข้อมูล{arrow("n")}</th>
                <th className="r" onClick={() => sortOrg("api")}>มี API{arrow("api")}</th>
                <th className="r" onClick={() => sortOrg("file")}>ไฟล์อย่างเดียว{arrow("file")}</th>
                <th className="r" onClick={() => sortOrg("c1")}>ย้อนหลังครบ{arrow("c1")}</th>
                <th className="r" onClick={() => sortOrg("c2")}>มีปี {cur}{arrow("c2")}</th>
                <th className="r" onClick={() => sortOrg("c3")}>Machine readable{arrow("c3")}</th>
                <th onClick={() => sortOrg("pct")}>ผ่านครบ{arrow("pct")}</th>
              </tr>
            </thead>
            <tbody>
              {orgRows.map((r) => (
                <tr key={r.org} className={"click" + (pick === r.org ? " sel" : "")} onClick={() => setPick(pick === r.org ? "" : r.org)}>
                  <td className="c-org-name">{r.org}</td>
                  <td className="r" data-label="ชุดข้อมูล">{r.n}</td>
                  <td className="r" data-label="มี API">{r.api}</td>
                  <td className="r" data-label="ไฟล์อย่างเดียว">{r.file}</td>
                  <td className="r" data-label="ย้อนหลังครบ"><Frac a={r.c1} b={r.n} /></td>
                  <td className="r" data-label={`มีปี ${cur}`}><Frac a={r.c2} b={r.n} /></td>
                  <td className="r" data-label="Machine readable"><Frac a={r.c3} b={r.n} /></td>
                  <td className="pctcell" data-label="ผ่านครบ">
                    <span className="pbar"><i className={r.pct >= 0.8 ? "ok" : r.pct >= 0.5 ? "mid" : "bad"} style={{ width: `${r.pct * 100}%` }} /></span>
                    <span className="nowrap">{r.pass}/{r.n} · {pct(r.pass, r.n)}%</span>
                  </td>
                </tr>
              ))}
              {!orgRows.length && <tr><td colSpan={8} className="status">ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="tablebar">
          <h2 style={{ margin: 0 }}><Icon name="fact_check" /> รายชุดข้อมูล <span className="sub">({list.length.toLocaleString()} ชุด)</span></h2>
          <div className="row">
            {pick && <button className="chip" onClick={() => setPick("")}>{pick} ✕</button>}
            <div className="inline-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อชุดข้อมูล" /></div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="inline">
              {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={lsort} onChange={(e) => setLsort(e.target.value)} className="inline" aria-label="เรียงรายชุดข้อมูล">
              {LSORTS.map(([v, l]) => <option key={v} value={v}>เรียง: {l}</option>)}
            </select>
            <button className="btn" onClick={exportList}><Icon name="download" /> ส่งออก CSV</button>
          </div>
        </div>
        <div className="legend sub">
          <span><i className="yb has" /> มีข้อมูล</span>
          <span><i className="yb miss" /> ขาด</span>
          <span><Check ok /> ผ่าน</span>
          <span><Check ok={false} /> ไม่ผ่าน</span>
        </div>
        <div className="tw">
          <table className="cards dtable">
            <thead>
              <tr>
                <th>ชุดข้อมูล</th>
                <th>API / ไฟล์</th>
                <th>ปี {span}</th>
                <th className="c">ย้อนหลัง</th>
                <th className="c">ปี {cur}</th>
                <th className="c">MR</th>
                <th>รูปแบบ</th>
                <th>ผล</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, shown).map((d) => (
                <tr key={d.id}>
                  <td className="c-name">
                    <a href={d.url} target="_blank" rel="noopener">{d.title}</a>
                    <div className="sub">{d.org}{d.groups.length ? ` · ${d.groups.join(", ")}` : ""} · {d.files.length ? `${d.files.length} ไฟล์` : <b className="badt">ไม่มีไฟล์แนบ</b>}{d.latest ? ` · ปีล่าสุด ${d.latest}` : ""}</div>
                  </td>
                  <td className="c-acc" data-label="API / ไฟล์"><AccessBadge type={d.access} />{d.access === "API" && d.nApi < d.files.length && <div className="sub">API {d.nApi}/{d.files.length} ไฟล์</div>}</td>
                  <td className="c-ys" data-label={`ปี ${span}`}>
                    <div className="ystrip">
                      {required.map((y) => (
                        <span key={y} className={"yb " + (d.ys.has(y) ? "has" : "miss")} title={`${y}: ${d.ys.has(y) ? "มีข้อมูล" : "ไม่มีข้อมูล"}`}>{String(y).slice(2)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="c" data-label="ย้อนหลัง"><Check ok={d.c1} title={d.c1 ? "ครบ" : `ขาด ${d.missing.join(", ")}`} /></td>
                  <td className="c" data-label={`ปี ${cur}`}><Check ok={d.c2} /></td>
                  <td className="c" data-label="MR"><Check ok={d.c3} /></td>
                  <td className="c-fmt">{d.fmts.map((f) => <span key={f} className={"fmt " + f + (MR_FORMATS.has(f) ? "" : " nmr")}>{f}</span>)}</td>
                  <td className="c-res">
                    {d.pass
                      ? <span className="badge ok"><Icon name="verified" fill /> ผ่าน</span>
                      : <><span className="badge bad">ไม่ผ่าน</span><div className="sub reason">{d.reasons.join(" · ")}</div></>}
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8} className="status">ไม่พบชุดข้อมูลที่ตรงเงื่อนไข</td></tr>}
            </tbody>
          </table>
        </div>
        {shown < list.length && (
          <div className="more"><button className="btn" onClick={() => setShown((s) => s + PAGE)}>แสดงเพิ่ม (เหลืออีก {list.length - shown})</button></div>
        )}
      </div>
    </>
  );
}

function Frac({ a, b }) {
  return <span className={a === b ? "okt" : a === 0 ? "badt" : ""}>{a}/{b}</span>;
}

function Kpi({ icon, v, l, tone = "" }) {
  return (
    <div className={"kpi " + tone}>
      <Icon name={icon} className="kicon" />
      <b>{Number(v).toLocaleString()}</b>
      <span>{l}</span>
    </div>
  );
}
