import { useEffect, useRef, useState } from "react";
import { jsonp } from "../api.js";

// ดูตัวอย่างข้อมูลจาก DataStore ของ CKAN (200 แถวแรก)
export default function PreviewDialog({ file, onClose }) {
  const ref = useRef(null);
  const [q, setQ] = useState("");
  const [state, setState] = useState({ loading: true });

  useEffect(() => { if (ref.current && !ref.current.open) ref.current.showModal(); }, []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    const t = setTimeout(async () => {
      try {
        const params = { resource_id: file.id, limit: 200 };
        if (q.trim()) params.q = q.trim();
        const r = await jsonp("datastore_search", params);
        if (!alive) return;
        setState({ loading: false, cols: r.fields.map((x) => x.id).filter((x) => x !== "_id"), rows: r.records, total: r.total ?? r.records.length });
      } catch (e) {
        if (alive) setState({ loading: false, error: e.message });
      }
    }, q ? 400 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [file.id, q]);

  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="dh">
        <div>
          <b>{file.name}</b>
          <div className="sub">
            {file.ds} ·{" "}
            {state.loading ? "กำลังโหลด…" : state.error ? `ดูตัวอย่างไม่ได้: ${state.error}` : `แสดง ${state.rows.length.toLocaleString()} จาก ${state.total.toLocaleString()} แถว`}
          </div>
        </div>
        <div className="row">
          <input placeholder="ค้นหาในข้อมูล" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 180 }} />
          <button className="btn" onClick={() => ref.current?.close()}>ปิด</button>
        </div>
      </div>
      <div className="db">
        {state.rows && (
          <table>
            <thead><tr>{state.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {state.rows.map((rec, i) => (
                <tr key={rec._id ?? i}>{state.cols.map((c) => <td key={c}>{String(rec[c] ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </dialog>
  );
}
