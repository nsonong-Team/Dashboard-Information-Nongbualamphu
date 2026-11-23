import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE, CUR_Y, loadFiles, exportCSV, thDate, match } from "./api.js";
import { evaluate, summarize } from "./stats.js";
import Filters from "./components/Filters.jsx";
import YearChart from "./components/YearChart.jsx";
import BarList from "./components/BarList.jsx";
import FileTable from "./components/FileTable.jsx";
import PreviewDialog from "./components/PreviewDialog.jsx";
import Compliance from "./components/Compliance.jsx";
import Rail from "./components/Rail.jsx";
import Hero from "./components/Hero.jsx";
import Overview from "./components/Overview.jsx";
import DetailDrawer from "./components/DetailDrawer.jsx";
import Icon from "./components/Icon.jsx";

const EMPTY = { q: "", years: [], org: [], group: [], fmt: [], freq: [], access: [] };
const CHECK_HIDE = ["years", "fmt", "access"]; // มุมมองระดับชุดข้อมูลมีเงื่อนไขปี/รูปแบบของตัวเอง
const TITLES = {
  files: ["ไฟล์ทั้งหมด", "ค้นหาและดาวน์โหลดไฟล์ทุกไฟล์ในบัญชีข้อมูลจังหวัด"],
  check: ["ตรวจสอบตามเงื่อนไข", "ผลตรวจรายชุดข้อมูล สรุปรายหน่วยงานหรือรายกลุ่ม พร้อมเหตุผลที่ไม่ผ่าน"],
};

export default function App() {
  const [files, setFiles] = useState([]);
  const [allDs, setAllDs] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "", at: null });
  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState({ key: "mod", dir: -1 });
  const [autoMin, setAutoMin] = useState(0);
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState("overview");
  const [cfg, setCfg] = useState({ cur: CUR_Y, n: 5, mrOnly: false });
  const [view, setView] = useState("issue");
  const [cardSort, setCardSort] = useState("order");
  const [detail, setDetail] = useState(null);
  const gridRef = useRef(null);

  const load = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true, error: "" }));
    try {
      const r = await loadFiles();
      setFiles(r.files);
      setAllDs(r.datasets);
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
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const setF = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const active = useMemo(() => ({ ...filters, q: filters.q.trim().toLowerCase() }), [filters]);

  const fileView = useMemo(() => {
    const getter = { name: (f) => f.name, org: (f) => f.org, year: (f) => f.yMax, fmt: (f) => f.fmt, mod: (f) => f.mod }[sort.key];
    return files
      .filter((f) => match(f, active))
      .sort((a, b) => { const x = getter(a), y = getter(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [files, active, sort]);

  const yearCounts = useMemo(() => {
    const m = new Map();
    for (const f of files) if (match(f, active, "years")) for (const y of f.years) m.set(y, (m.get(y) || 0) + 1);
    return [...m].sort((a, b) => a[0] - b[0]);
  }, [files, active]);

  const checkFiles = useMemo(() => files.filter((f) => match(f, active, CHECK_HIDE)), [files, active]);
  const emptyDs = useMemo(() => allDs.filter((d) => !d.nFiles && match(d, active, CHECK_HIDE)), [allDs, active]);
  const evaluated = useMemo(() => evaluate(checkFiles, emptyDs, cfg), [checkFiles, emptyDs, cfg]);

  // ภาพรวมทั้งจังหวัดในส่วนหัว ไม่ขึ้นกับตัวกรอง
  const province = useMemo(() => {
    const all = evaluate(files, allDs.filter((d) => !d.nFiles), cfg);
    const n = all.length, cur = all.filter((d) => d.c2).length, pass = all.filter((d) => d.pass).length;
    const orgs = summarize(all, "org");
    return { n, cur, pass, pCur: n ? cur / n : 0, pPass: n ? pass / n : 0, orgs: orgs.length, zero: orgs.filter((o) => o.cur === 0).length };
  }, [files, allDs, cfg]);

  const kpi = useMemo(() => {
    const extra = filters.years.length || filters.fmt.length || filters.access.length ? [] : emptyDs;
    const ys = fileView.flatMap((f) => f.years);
    const last = fileView.reduce((m, f) => (f.mod > m ? f.mod : m), "");
    return {
      ds: new Set(fileView.map((f) => f.dsId)).size + extra.length,
      empty: extra.length,
      files: fileView.length,
      orgs: new Set([...fileView, ...extra].map((f) => f.org)).size,
      range: ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "–",
      last: thDate(last, { day: "numeric", month: "short", year: "2-digit" }),
    };
  }, [fileView, emptyDs, filters.years, filters.fmt, filters.access]);

  const toggleYear = (y) => setF({ years: filters.years.includes(y) ? filters.years.filter((x) => x !== y) : [...filters.years, y] });
  const focusGrid = (v, s) => {
    setView(v); setCardSort(s);
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  };

  const ready = !(status.loading && !files.length) && !(!files.length && status.error);

  return (
    <div className="shell">
      <a className="skip" href="#main">ข้ามไปเนื้อหา</a>
      <Rail tab={tab} setTab={setTab} status={status} onReload={load} autoMin={autoMin} setAutoMin={setAutoMin} />
      <main id="main" className="main">
        {tab === "overview" ? (
          ready && <Hero total={province} cur={cfg.cur} zeroOrgs={province.zero}
            onFocusNeed={() => focusGrid("issue", "need")} onShowZero={() => focusGrid("org", "need")} />
        ) : (
          <header className="page-head">
            <h1>{TITLES[tab][0]}</h1>
            <p className="sub">{TITLES[tab][1]} · ข้อมูลสดจาก <a href={BASE + "/dataset/"} target="_blank" rel="noopener">nongbualamphu.gdcatalog.go.th</a></p>
          </header>
        )}

        <div className="content">
          <Filters files={files} filters={filters} active={active} setF={setF} reset={() => setFilters(EMPTY)} hide={tab === "files" ? [] : CHECK_HIDE} />

          {status.loading && !files.length ? (
            <div className="egrid skel" aria-busy="true" aria-label="กำลังดึงข้อมูลจาก GD Catalog">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="ecard skel-card" />)}
            </div>
          ) : !files.length && status.error ? (
            <div className="state-error" role="alert">
              <Icon name="cloud_off" />
              <div>
                <b>ดึงข้อมูลจาก GD Catalog ไม่สำเร็จ</b>
                <p>{status.error} — ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วลองอีกครั้ง</p>
              </div>
              <button type="button" className="btn-amber" onClick={load}><Icon name="refresh" /> ลองอีกครั้ง</button>
            </div>
          ) : tab === "overview" ? (
            <Overview ref={gridRef} datasets={evaluated} cfg={cfg} setCfg={setCfg} view={view} setView={setView}
              sort={cardSort} setSort={setCardSort} onOpen={(row, meta) => setDetail({ row, meta })} />
          ) : tab === "check" ? (
            <Compliance files={checkFiles} emptyDatasets={emptyDs} cfg={cfg} setCfg={setCfg} />
          ) : (
            <>
              <div className="kpis">
                <Kpi icon="dataset" v={kpi.ds.toLocaleString()} l={kpi.empty ? `ชุดข้อมูล (ไม่มีไฟล์แนบ ${kpi.empty} ชุด)` : "ชุดข้อมูล"} />
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
                <div className="card"><h2><Icon name="apartment" /> หน่วยงานที่มีไฟล์มากที่สุด</h2><BarList list={fileView} keyFn={(f) => f.org} onPick={(v) => setF({ org: [v] })} /></div>
                <div className="card"><h2><Icon name="description" /> รูปแบบไฟล์</h2><BarList list={fileView} keyFn={(f) => f.fmt} onPick={(v) => setF({ fmt: [v] })} /></div>
              </div>
              <div className="card">
                <div className="tablebar">
                  <h2 style={{ margin: 0 }}><Icon name="list_alt" /> รายการไฟล์ <span className="sub">({fileView.length.toLocaleString()} ไฟล์)</span></h2>
                  <button className="btn" onClick={() => exportCSV(fileView)} disabled={!fileView.length}><Icon name="download" /> ส่งออกรายการเป็น CSV</button>
                </div>
                <FileTable view={fileView} sort={sort} setSort={setSort} onPreview={setPreview} />
              </div>
            </>
          )}

          <footer className="foot">
            <img src="brand/emblem-nbl-statistics.png" alt="" aria-hidden="true" width="447" height="447" />
            <p>จัดทำโดยสำนักงานสถิติจังหวัดหนองบัวลำภู · ข้อมูลทั้งหมดเป็นของหน่วยงานเจ้าของชุดข้อมูล แสดงผลจาก API สาธารณะของ GD Catalog
              · <a href="img/credits.json" target="_blank" rel="noopener">ที่มาของภาพ</a></p>
          </footer>
        </div>
      </main>

      {preview && <PreviewDialog file={preview} onClose={() => setPreview(null)} />}
      {detail && <DetailDrawer row={detail.row} meta={detail.meta} cfg={cfg} byOrg={view === "org"} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Kpi({ icon, v, l }) {
  return <div className="kpi"><Icon name={icon} className="kicon" /><b>{v || "–"}</b><span>{l}</span></div>;
}
