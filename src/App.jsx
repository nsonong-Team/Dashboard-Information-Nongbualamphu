import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE, loadFiles, exportCSV, thDate, match } from "./api.js";
import Filters from "./components/Filters.jsx";
import YearChart from "./components/YearChart.jsx";
import BarList from "./components/BarList.jsx";
import FileTable from "./components/FileTable.jsx";
import PreviewDialog from "./components/PreviewDialog.jsx";
import Compliance from "./components/Compliance.jsx";
import Icon from "./components/Icon.jsx";

const EMPTY = { q: "", years: [], org: [], group: [], fmt: [], freq: [] };
const CHECK_HIDE = ["years", "fmt"]; // แท็บตรวจสอบมีเงื่อนไขปี/รูปแบบของตัวเอง

export default function App() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "", at: null });
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState({ key: "mod", dir: -1 });
  const [autoMin, setAutoMin] = useState(0);
  const [preview, setPreview] = useState(null);
  const [theme, setTheme] = useState(null);
  const [tab, setTab] = useState("files");

  const load = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true, error: "" }));
    try {
      setFiles(await loadFiles());
      setStatus({ loading: false, error: "", at: new Date() });
    } catch (e) {
      setStatus((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoMin) return;
    const t = setInterval(load, autoMin * 60000);
    return () => clearInterval(t);
  }, [autoMin, load]);
  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; }, [theme]);

  const setF = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const active = useMemo(() => ({ ...filters, q: filters.q.trim().toLowerCase() }), [filters]);

  const view = useMemo(() => {
    const getter = { name: (f) => f.name, org: (f) => f.org, year: (f) => f.yMax, fmt: (f) => f.fmt, mod: (f) => f.mod }[sort.key];
    return files
      .filter((f) => match(f, active))
      .sort((a, b) => { const x = getter(a), y = getter(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [files, active, sort]);

  // กราฟปีไม่สนตัวกรองปี เพื่อให้เห็นทุกแท่ง
  const yearCounts = useMemo(() => {
    const m = new Map();
    for (const f of files) if (match(f, active, "years")) for (const y of f.years) m.set(y, (m.get(y) || 0) + 1);
    return [...m].sort((a, b) => a[0] - b[0]);
  }, [files, active]);

  const checkFiles = useMemo(() => files.filter((f) => match(f, active, CHECK_HIDE)), [files, active]);

  const kpi = useMemo(() => {
    const ys = view.flatMap((f) => f.years);
    const last = view.reduce((m, f) => (f.mod > m ? f.mod : m), "");
    return {
      ds: new Set(view.map((f) => f.dsId)).size,
      files: view.length,
      orgs: new Set(view.map((f) => f.org)).size,
      range: ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "–",
      last: thDate(last, { day: "numeric", month: "short", year: "2-digit" }),
    };
  }, [view]);

  const toggleYear = (y) => setF({ years: filters.years.includes(y) ? filters.years.filter((x) => x !== y) : [...filters.years, y] });
  const toggleTheme = () => {
    const cur = theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(cur === "dark" ? "light" : "dark");
  };

  return (
    <div className="wrap">
      <header>
        <div>
          <h1><Icon name="folder_data" /> คลังไฟล์ข้อมูลจังหวัดหนองบัวลำภู</h1>
          <div className="sub">
            ดึงข้อมูลสดจาก <a href={BASE + "/dataset/"} target="_blank" rel="noopener">nongbualamphu.gdcatalog.go.th</a> ·{" "}
            {status.loading ? "กำลังโหลด…" : status.error ? `โหลดไม่สำเร็จ: ${status.error}` : `โหลดล่าสุด ${status.at.toLocaleString("th-TH")}`}
          </div>
        </div>
        <div className="row">
          <select className="btn" value={autoMin} onChange={(e) => setAutoMin(+e.target.value)} title="รีเฟรชอัตโนมัติ">
            <option value={0}>รีเฟรชอัตโนมัติ: ปิด</option>
            <option value={15}>ทุก 15 นาที</option>
            <option value={60}>ทุก 1 ชั่วโมง</option>
          </select>
          <button className="btn" onClick={load} disabled={status.loading}><Icon name="refresh" /> โหลดใหม่</button>
          <button className="btn" onClick={toggleTheme} title="สลับธีม"><Icon name="contrast" /></button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "files" ? "on" : ""} onClick={() => setTab("files")}><Icon name="folder_open" /> ไฟล์ทั้งหมด</button>
        <button className={tab === "check" ? "on" : ""} onClick={() => setTab("check")}><Icon name="fact_check" /> ตรวจสอบตามเงื่อนไข</button>
      </nav>

      <Filters files={files} filters={filters} active={active} setF={setF} reset={() => setFilters(EMPTY)} hide={tab === "check" ? CHECK_HIDE : []} />

      {status.loading && !files.length ? (
        <div className="card status">กำลังโหลดข้อมูลจาก API…</div>
      ) : !files.length && status.error ? (
        <div className="card status">ดึงข้อมูลไม่ได้ ({status.error}) — ลองกด “โหลดใหม่”</div>
      ) : tab === "check" ? (
        <Compliance files={checkFiles} />
      ) : (
        <>
          <div className="kpis">
            <Kpi icon="dataset" v={kpi.ds.toLocaleString()} l="ชุดข้อมูล" />
            <Kpi icon="description" v={kpi.files.toLocaleString()} l="ไฟล์ทั้งหมด" />
            <Kpi icon="apartment" v={kpi.orgs.toLocaleString()} l="หน่วยงาน" />
            <Kpi icon="calendar_month" v={kpi.range} l="ช่วงปีของข้อมูล (พ.ศ.)" />
            <Kpi icon="update" v={kpi.last} l="อัปเดตล่าสุด" />
          </div>

          <div className="card">
            <h2><Icon name="bar_chart" /> จำนวนไฟล์ตามปีของข้อมูล <span className="sub">(คลิกแท่งเพื่อเลือก/ยกเลิกปี เลือกได้หลายปี)</span></h2>
            <YearChart data={yearCounts} selected={filters.years} onPick={toggleYear} />
          </div>

          <div className="two">
            <div className="card"><h2><Icon name="apartment" /> หน่วยงานที่มีไฟล์มากที่สุด</h2><BarList list={view} keyFn={(f) => f.org} onPick={(v) => setF({ org: [v] })} /></div>
            <div className="card"><h2><Icon name="description" /> รูปแบบไฟล์</h2><BarList list={view} keyFn={(f) => f.fmt} onPick={(v) => setF({ fmt: [v] })} /></div>
          </div>

          <div className="card">
            <div className="tablebar">
              <h2 style={{ margin: 0 }}><Icon name="list_alt" /> รายการไฟล์ <span className="sub">({view.length.toLocaleString()} ไฟล์)</span></h2>
              <button className="btn" onClick={() => exportCSV(view)} disabled={!view.length}><Icon name="download" /> ส่งออกรายการเป็น CSV</button>
            </div>
            <FileTable view={view} sort={sort} setSort={setSort} onPreview={setPreview} />
          </div>
        </>
      )}

      <footer className="sub">ข้อมูลทั้งหมดเป็นของหน่วยงานเจ้าของชุดข้อมูล · หน้านี้แสดงผลจาก API สาธารณะของ GD Catalog</footer>

      {preview && <PreviewDialog file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function Kpi({ icon, v, l }) {
  return <div className="kpi"><Icon name={icon} className="kicon" /><b>{v || "–"}</b><span>{l}</span></div>;
}
