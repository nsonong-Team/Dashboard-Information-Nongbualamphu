export const BASE = "https://nongbualamphu.gdcatalog.go.th";
const API = BASE + "/api/3/action/";

// API ของพอร์ทัลไม่ส่ง CORS header จึงเรียกแบบ JSONP (CKAN รองรับ ?callback=)
export function jsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const qs = new URLSearchParams({ ...params, callback: cb });
    const s = document.createElement("script");
    const timer = setTimeout(() => { cleanup(); reject(new Error("หมดเวลาเชื่อมต่อ")); }, 60000);
    function cleanup() { clearTimeout(timer); delete window[cb]; s.remove(); }
    window[cb] = (data) => {
      cleanup();
      if (data && data.success) resolve(data.result);
      else reject(new Error(data?.error?.message || "API error"));
    };
    s.onerror = () => { cleanup(); reject(new Error("โหลดไม่สำเร็จ")); };
    s.src = API + action + "?" + qs;
    document.head.appendChild(s);
  });
}

export const CUR_Y = new Date().getFullYear() + 543; // ปีปัจจุบัน (พ.ศ.)
const MAX_Y = CUR_Y + 3; // ตัดปีที่พิมพ์ผิด เช่น 2666

// รูปแบบไฟล์ที่นับเป็น Machine readable (PDF, HTML, DOCX, รูปภาพ, RAR ไม่นับ)
export const MR_FORMATS = new Set(["CSV", "XLSX", "XLS", "JSON", "XML", "API", "ODS", "TSV", "GEOJSON", "KML", "SHP"]);
const validY = (y) => { y = parseInt(y, 10); return y >= 2450 && y <= MAX_Y ? y : null; };

// หาปีของไฟล์: ใช้ค่าที่หน่วยงานกรอก → ถ้าไม่มี ดูจากชื่อไฟล์ → ถ้าไม่มี ใช้ของชุดข้อมูล
function yearsOf(r, p) {
  let a = validY(r.resource_first_year_of_data), b = validY(r.resource_last_year_of_data);
  if (!a && !b) {
    const t = (r.name || "") + " " + (r.description || "");
    const m = t.match(/(25\d\d)\s*[-–]\s*(25\d\d)/);
    if (m) { a = validY(m[1]); b = validY(m[2]); }
    else {
      const ys = (t.match(/25\d\d/g) || []).map(validY).filter(Boolean);
      if (ys.length) { a = Math.min(...ys); b = Math.max(...ys); }
    }
  }
  if (!a && !b) { a = validY(p.first_year_of_data); b = validY(p.last_year_of_data); }
  a = a || b; b = b || a;
  if (!a) return [];
  if (b < a) [a, b] = [b, a];
  if (b - a > 40) a = b - 40;
  const out = [];
  for (let y = a; y <= b; y++) out.push(y);
  return out;
}

export async function loadFiles() {
  let start = 0, all = [], count = 1;
  while (start < count) {
    const r = await jsonp("package_search", { rows: 1000, start });
    count = r.count; all = all.concat(r.results); start += 1000;
    if (!r.results.length) break;
  }
  const files = [];
  // รายชุดข้อมูลทั้งหมด (รวมชุดที่ยังไม่มีไฟล์แนบ) — ใช้นับจำนวนชุดและใช้ในแท็บตรวจสอบ
  const datasets = all.map((p) => ({
    dsId: p.id,
    ds: p.title,
    dsUrl: `${BASE}/dataset/${p.name}`,
    org: p.organization ? p.organization.title : "ไม่ระบุ",
    groups: (p.groups || []).map((g) => g.title),
    freq: p.update_frequency_unit || "ไม่ระบุ",
    nFiles: (p.resources || []).length,
    years: [], fmt: "", access: "",
    text: [p.title, p.notes, (p.tags || []).map((t) => t.name).join(" ")].join(" ").toLowerCase(),
  }));
  for (const p of all) for (const r of p.resources || []) {
    const years = yearsOf(r, p);
    files.push({
      id: r.id,
      dsId: p.id,
      name: r.name || "(ไม่มีชื่อ)",
      fmt: (r.format || "อื่นๆ").toUpperCase(),
      url: r.url,
      page: `${BASE}/dataset/${p.name}/resource/${r.id}`,
      dsUrl: `${BASE}/dataset/${p.name}`,
      ds: p.title,
      org: p.organization ? p.organization.title : "ไม่ระบุ",
      groups: (p.groups || []).map((g) => g.title),
      freq: p.update_frequency_unit || "ไม่ระบุ",
      years,
      yMax: years.length ? years[years.length - 1] : 0,
      mod: r.last_modified || r.metadata_modified || r.created || p.metadata_modified || "",
      datastore: !!r.datastore_active,
      // API = ดึงข้อมูลผ่าน API ได้ (เปิด DataStore หรือหน่วยงานระบุรูปแบบเป็น API), ไฟล์ = ต้องดาวน์โหลดไปเปิดเอง
      access: r.datastore_active || (r.format || "").toUpperCase() === "API" ? "API" : "ไฟล์",
      text: [r.name, r.description, p.title, p.notes, (p.tags || []).map((t) => t.name).join(" ")].join(" ").toLowerCase(),
    });
  }
  return { files, datasets };
}

export const yearLabel = (ys) => (!ys.length ? "–" : ys.length === 1 ? String(ys[0]) : `${ys[0]}–${ys[ys.length - 1]}`);
export const thDate = (s, opts) => (s ? new Date(s).toLocaleDateString("th-TH", opts) : "–");

// กรองไฟล์ตามตัวกรอง; skip = ชื่อตัวกรองที่ไม่ต้องใช้ (ใช้คำนวณจำนวนในแต่ละตัวเลือก)
export function match(f, c, skip) {
  const sk = new Set([].concat(skip || []));
  if (!sk.has("q") && c.q && !c.q.split(/s+/).every((w) => f.text.includes(w))) return false;
  if (!sk.has("years") && c.years.length && !f.years.some((y) => c.years.includes(y))) return false;
  for (const k of ["org", "fmt", "freq", "access"]) if (!sk.has(k) && c[k].length && !c[k].includes(f[k])) return false;
  if (!sk.has("group") && c.group.length && !f.groups.some((g) => c.group.includes(g))) return false;
  return true;
}

export function exportRows(filename, head, rows) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head, ...rows].map((r) => r.map(q).join(","));
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportCSV(list) {
  exportRows(
    "รายการไฟล์.csv",
    ["ชื่อไฟล์", "ชุดข้อมูล", "หน่วยงาน", "ปีข้อมูล", "รูปแบบ", "MR (อ่านด้วยเครื่องได้)", "อัปเดต", "ลิงก์ดาวน์โหลด", "หน้าเว็บ"],
    list.map((f) => [f.name, f.ds, f.org, yearLabel(f.years), f.fmt, MR_FORMATS.has(f.fmt) ? "ใช่" : "ไม่ใช่", f.mod.slice(0, 10), f.url, f.page])
  );
}
