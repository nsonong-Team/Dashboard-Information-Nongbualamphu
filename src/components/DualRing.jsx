import { useEffect, useState } from "react";
import { useCountUp } from "../hooks.js";
import { CUR_Y } from "../api.js";

// วงสัญญาณซ้อน 2 ชั้น: นอก (อำพัน) = มีข้อมูลปีปัจจุบัน, ใน (น้ำเงิน) = ผ่านเงื่อนไขครบ
// ค่าทั้งสองเป็นสัดส่วน 0–1; วาดตัวเองตอนแสดงครั้งแรก
// มีป้ายกำกับในวง (ปี xx / ผ่าน) เพื่อไม่ต้องพึ่งคำอธิบายด้านบนเมื่อเลื่อนลงไปไกล
export default function DualRing({ outer, inner, size = 92, label, delay = 0, big = false, cur = CUR_Y }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 60 + delay); return () => clearTimeout(t); }, [delay]);
  const sw = big ? 12 : 7, gap = big ? 6 : 4;
  const r1 = size / 2 - sw / 2 - 1, r2 = r1 - sw - gap;
  const C1 = 2 * Math.PI * r1, C2 = 2 * Math.PI * r2;
  const o = useCountUp(Math.round(outer * 100), 1200 + delay);
  const i = useCountUp(Math.round(inner * 100), 1200 + delay);
  const low = outer < 0.25;
  return (
    <figure className={"dring" + (big ? " big" : "") + (low ? " low" : "") + (size < 90 ? " sm" : "")} style={{ width: size, height: size }}
      role="img" aria-label={`${label ? label + ": " : ""}มีข้อมูลปีปัจจุบัน ${Math.round(outer * 100)}% · ผ่านเงื่อนไขครบ ${Math.round(inner * 100)}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="trk" cx={size / 2} cy={size / 2} r={r1} strokeWidth={sw} />
        <circle className="trk" cx={size / 2} cy={size / 2} r={r2} strokeWidth={sw} />
        <circle className="arc amber" cx={size / 2} cy={size / 2} r={r1} strokeWidth={sw}
          strokeDasharray={C1} strokeDashoffset={on ? C1 * (1 - outer) : C1} style={{ transitionDelay: `${delay}ms` }} />
        <circle className="arc blue" cx={size / 2} cy={size / 2} r={r2} strokeWidth={sw}
          strokeDasharray={C2} strokeDashoffset={on ? C2 * (1 - inner) : C2} style={{ transitionDelay: `${delay + 120}ms` }} />
      </svg>
      <figcaption>
        <span className="lbl" aria-hidden="true">ปี {String(cur).slice(2)}</span>
        <b className={"o" + (Math.round(o) >= 100 ? " w3" : "")}>{Math.round(o)}<small>%</small></b>
        {/* บรรทัดล่างไม่ใส่ % เพื่อไม่ให้ข้อความกว้างจนทับเส้นวง (ความหมายบอกด้วยคำว่า "ผ่าน" แล้ว) */}
        <span className="i"><span className="lbl-i">ผ่าน </span>{Math.round(i)}</span>
      </figcaption>
    </figure>
  );
}
