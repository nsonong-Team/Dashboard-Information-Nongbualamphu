// เก็บมุมมองปัจจุบัน (หน้า, ตัวกรอง, การเรียง, เงื่อนไข) ไว้ใน URL hash
// เพื่อส่งลิงก์ "มุมมองที่ตีวงแคบแล้ว" ให้คนอื่นเปิดเห็นเหมือนกัน เช่น หน่วยงานที่ยังไม่มีข้อมูลปีปัจจุบัน
const LISTS = { y: "years", o: "org", g: "group", f: "fmt", fr: "freq", a: "access" };
const SEP = "|";

export function readUrlState() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ""));
  const filters = { q: p.get("q") || "" };
  for (const [k, name] of Object.entries(LISTS)) {
    const v = p.get(k);
    filters[name] = v ? v.split(SEP).filter(Boolean).map((x) => (name === "years" ? +x : x)) : [];
  }
  const num = (k) => (p.get(k) && !isNaN(+p.get(k)) ? +p.get(k) : undefined);
  return {
    tab: ["overview", "files", "check"].includes(p.get("t")) ? p.get("t") : undefined,
    view: ["issue", "org"].includes(p.get("v")) ? p.get("v") : undefined,
    cardSort: p.get("s") || undefined,
    show: p.get("sh") || "",
    tier: p.get("tr") || "",
    filters,
    cfg: { cur: num("cy"), n: num("n"), mrOnly: p.get("mr") === "1" ? true : undefined },
  };
}

export function writeUrlState({ tab, view, cardSort, show, tier, filters, cfg, defaults }) {
  const p = new URLSearchParams();
  if (tab !== "overview") p.set("t", tab);
  if (view !== "issue") p.set("v", view);
  if (cardSort !== (view === "issue" ? "order" : "need")) p.set("s", cardSort);
  if (show) p.set("sh", show);
  if (tier && view === "org") p.set("tr", tier);
  if (filters.q) p.set("q", filters.q);
  for (const [k, name] of Object.entries(LISTS)) if (filters[name]?.length) p.set(k, filters[name].join(SEP));
  if (cfg.cur !== defaults.cur) p.set("cy", cfg.cur);
  if (cfg.n !== defaults.n) p.set("n", cfg.n);
  if (cfg.mrOnly) p.set("mr", "1");
  const hash = p.toString();
  const url = location.pathname + location.search + (hash ? "#" + hash : "");
  if (url !== location.pathname + location.search + location.hash) history.replaceState(null, "", url);
}
