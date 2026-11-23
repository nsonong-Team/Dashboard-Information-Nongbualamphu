import { useEffect, useRef } from "react";
import { CUR_Y } from "../api.js";

// กราฟจำนวนไฟล์ตามปี — คลิกแท่งเพื่อเพิ่ม/ลบปีออกจากตัวกรอง (เลือกได้หลายปี)
export default function YearChart({ data, selected, onPick }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth; }, [data]);

  if (!data.length) return <div className="status">ไม่มีข้อมูลปี</div>;
  const max = Math.max(...data.map(([, n]) => n));
  return (
    <div className="chart" ref={ref}>
      {data.map(([y, n]) => (
        <button
          key={y}
          className={"col" + (selected.includes(y) ? " on" : "") + (y === CUR_Y ? " cur" : "")}
          title={`ปี ${y}: ${n} ไฟล์`}
          onClick={() => onPick(y)}
        >
          <span className="v">{n}</span>
          <span className="b" style={{ height: `${(n / max) * 100}%` }} />
          <span className="y">{y}</span>
        </button>
      ))}
    </div>
  );
}
