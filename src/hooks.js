import { useEffect, useLayoutEffect, useState } from "react";

// ปิด popover เมื่อคลิกข้างนอกหรือกด Esc
export function usePopover(ref, open, setOpen) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, setOpen]);
}

// เลือกว่าจะให้ popover ชิดซ้ายหรือขวา ตามพื้นที่ว่างบนหน้าจอ (กันล้นขอบจอ)
export function useAutoAlign(ref, open, popWidth = 340) {
  const [side, setSide] = useState("left");
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setSide(r.left + Math.max(r.width, popWidth) > window.innerWidth - 8 ? "right" : "left");
  }, [open, ref, popWidth]);
  return side;
}

// จอมือถือ (ใช้ตัดสินใจเรื่อง autofocus — บนมือถือไม่เด้งคีย์บอร์ดขึ้นมาเอง)
export const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
