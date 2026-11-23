export default function BarList({ list, keyFn, onPick, top = 10 }) {
  const m = new Map();
  for (const f of list) { const k = keyFn(f); m.set(k, (m.get(k) || 0) + 1); }
  const rows = [...m].sort((a, b) => b[1] - a[1]).slice(0, top);
  if (!rows.length) return <div className="sub">ไม่มีข้อมูล</div>;
  const max = rows[0][1];
  return (
    <div className="hlist">
      {rows.map(([k, v]) => (
        <button key={k} title={k} onClick={() => onPick(k)}>
          <span className="n">{k}</span>
          <span className="t"><i style={{ width: `${(v / max) * 100}%` }} /></span>
          <span className="c">{v}</span>
        </button>
      ))}
    </div>
  );
}
