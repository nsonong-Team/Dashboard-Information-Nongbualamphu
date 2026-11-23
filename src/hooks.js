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

// ผู้ใช้ตั้งค่า "ลดการเคลื่อนไหว" ไว้หรือไม่
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ตัวเลขนับขึ้นแบบ ease-out (ข้ามแอนิเมชันถ้าลดการเคลื่อนไหว)
export function useCountUp(target, duration = 1100) {
  const [v, setV] = useState(prefersReducedMotion() ? target : 0);
  useEffect(() => {
    if (prefersReducedMotion()) { setV(target); return; }
    let raf, t0;
    const from = 0;
    const step = (t) => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / duration);
      setV(from + (target - from) * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // กันกรณีแท็บอยู่เบื้องหลัง (rAF ถูกชะลอ): ให้จบที่ค่าจริงเสมอ
    const done = setTimeout(() => { cancelAnimationFrame(raf); setV(target); }, duration + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [target, duration]);
  return v;
}
