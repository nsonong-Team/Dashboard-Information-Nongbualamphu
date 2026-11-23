import { MR_FORMATS } from "./api.js";

export const NO_GROUP = "ไม่ระบุประเด็น";
export const OTHER_ISSUE = "other";

// 5 ประเด็นหลักของจังหวัด (ตามรายงาน Power BI ของจังหวัด) — จับคู่กับ "กลุ่ม" ใน GD Catalog ด้วยคำในชื่อกลุ่ม
export const ISSUES = [
  { id: "life", title: "การพัฒนาคุณภาพชีวิต", img: "img/issue-life.jpg", icon: "family_home", match: ["คุณภาพชีวิต"] },
  { id: "budget", title: "การบริหารงบประมาณ", img: "img/issue-budget.jpg", icon: "account_balance", match: ["งบประมาณ"] },
  { id: "tourism", title: "การส่งเสริมการท่องเที่ยวและการค้า (OTOP)", img: "img/issue-tourism.jpg", icon: "landscape", match: ["ท่องเที่ยว", "OTOP", "การค้า"] },
  { id: "waste", title: "การจัดการขยะมูลฝอย", img: "img/issue-waste.jpg", icon: "recycling", match: ["ขยะ"] },
  { id: "disaster", title: "การบริหารจัดการภัยพิบัติ", img: "img/issue-disaster.jpg", icon: "flood", match: ["ภัยพิบัติ", "สาธารณภัย", "อุทกภัย", "ภัยแล้ง", "วาตภัย", "ดินถล่ม", "ไฟป่า"] },
];
export const OTHER = { id: OTHER_ISSUE, title: "ประเด็นอื่น ๆ", img: "img/issue-other.jpg", icon: "grid_view", match: [] };

export const issuesOf = (groups) => {
  const ids = ISSUES.filter((i) => groups.some((g) => i.match.some((m) => g.includes(m)))).map((i) => i.id);
  return ids.length ? ids : [OTHER_ISSUE];
};

export const requiredYears = (cur, n) => Array.from({ length: n }, (_, i) => cur - n + 1 + i);

// ประเมินชุดข้อมูลตามเงื่อนไข (ใช้ร่วมกันทั้งหน้าการ์ดและแท็บตรวจสอบ)
export function evaluate(files, emptyDatasets, { cur, n, mrOnly }) {
  const required = requiredYears(cur, n);
  const m = new Map();
  for (const e of emptyDatasets) m.set(e.dsId, { id: e.dsId, title: e.ds, url: e.dsUrl, org: e.org, groups: e.groups, files: [] });
  for (const f of files) {
    let d = m.get(f.dsId);
    if (!d) { d = { id: f.dsId, title: f.ds, url: f.dsUrl, org: f.org, groups: f.groups, files: [] }; m.set(f.dsId, d); }
    d.files.push(f);
  }
  return [...m.values()].map((d) => {
    const mrFiles = d.files.filter((f) => MR_FORMATS.has(f.fmt));
    const ys = new Set((mrOnly ? mrFiles : d.files).flatMap((f) => f.years));
    const missing = required.filter((y) => !ys.has(y));
    const c1 = missing.length === 0, c2 = ys.has(cur), c3 = mrFiles.length > 0;
    const reasons = [];
    if (!d.files.length) reasons.push("ไม่มีไฟล์แนบ");
    else if (!c1) {
      // ปีปัจจุบันแจ้งแยกอีกข้อแล้ว ไม่ต้องซ้ำในรายการปีที่ขาด
      const back = c2 ? missing : missing.filter((y) => y !== cur);
      if (back.length) reasons.push(`ขาดปี ${back.join(", ")}`);
    }
    if (d.files.length && !c2) reasons.push(`ไม่มีปี ${cur}`);
    if (d.files.length && !c3) reasons.push("ไม่มีไฟล์ MR (ไฟล์ที่อ่านด้วยเครื่องได้ (CSV/Excel/JSON)) — อัปโหลดเป็น CSV หรือ Excel แทน PDF");
    const issues = issuesOf(d.groups);
    return {
      ...d, ys, missing, c1, c2, c3, pass: c1 && c2 && c3, reasons,
      fmts: [...new Set(d.files.map((f) => f.fmt))],
      latest: ys.size ? Math.max(...ys) : null,
      access: !d.files.length ? "none" : d.files.some((f) => f.access === "API") ? "API" : "ไฟล์",
      nApi: d.files.filter((f) => f.access === "API").length,
      issues,
      keys: { org: [d.org], group: d.groups.length ? d.groups : [NO_GROUP], issue: issues },
    };
  }).sort((a, b) => a.org.localeCompare(b.org, "th") || a.title.localeCompare(b.title, "th"));
}

// สรุปตามกลุ่ม (หน่วยงาน / ประเด็น / กลุ่ม) — ชุดที่อยู่หลายกลุ่มนับในทุกกลุ่ม
export function summarize(datasets, by) {
  const m = new Map();
  for (const d of datasets) for (const k of d.keys[by]) {
    const r = m.get(k) || { key: k, n: 0, cur: 0, pass: 0, c1: 0, c3: 0, api: 0, file: 0, none: 0, items: [] };
    r.n++; r.cur += d.c2; r.pass += d.pass; r.c1 += d.c1; r.c3 += d.c3;
    r.api += d.access === "API"; r.file += d.access === "ไฟล์"; r.none += d.access === "none";
    r.items.push(d);
    m.set(k, r);
  }
  return [...m.values()].map((r) => ({ ...r, pCur: r.n ? r.cur / r.n : 0, pPass: r.n ? r.pass / r.n : 0 }));
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
