import { useEffect, useRef, useState } from "react";
import DualRing from "./DualRing.jsx";
import Icon from "./Icon.jsx";
import { useCountUp } from "../hooks.js";

const Num = ({ v }) => <>{Math.round(useCountUp(v)).toLocaleString()}</>;

// ส่วนหัว: ภาพจังหวัดยามค่ำ + หัวข้อใหญ่ + วงสัญญาณของทั้งจังหวัด — เลื่อนลงแล้วหดเป็นแถบบาง (กดย่อ/ขยายเองได้)
export default function Hero({ total, cur, zeroOrgs, onFocusNeed, onShowZero }) {
  const [compact, setCompact] = useState(false); // ผู้ใช้กดย่อเอง
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting && e.boundingClientRect.top < 0));
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <section className={"hero" + (compact ? " compact" : "")} aria-labelledby="hero-title">
        <div className="hero-photo" aria-hidden="true">
          <img src="img/hero-wangbuaban.jpg" alt="" />
          <img className="hero-map" src="img/districts-line.svg" alt="" />
        </div>
        <div className="hero-body">
          <h1 id="hero-title">
            <span className="l1">ข้อมูลจังหวัด</span>
            <span className="l2">พร้อมแค่ไหน</span>
          </h1>
          <p className="hero-lede">
            ติดตามบัญชีข้อมูลหนองบัวลำภูสดจาก GD Catalog ทุกครั้งที่เปิด —{" "}
            <b><Num v={total.n} /></b> ชุดข้อมูล จาก <b><Num v={total.orgs} /></b> หน่วยงาน ไม่มีข้อมูลจำลอง
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-amber" onClick={onFocusNeed}>
              ดูประเด็นที่ต้องติดตาม <Icon name="arrow_forward" />
            </button>
          </div>
        </div>
        <div className="hero-signal">
          <DualRing outer={total.pCur} inner={total.pPass} size={compact ? 72 : 208} big={!compact} label="ทั้งจังหวัด" />
          <dl className="hero-legend">
            <div className="amber"><dt>มีข้อมูลปี {cur}</dt><dd><Num v={total.cur} /> <small>/ {total.n.toLocaleString()} ชุด</small></dd></div>
            <div className="blue"><dt>ผ่านเงื่อนไขครบ</dt><dd><Num v={total.pass} /> <small>/ {total.n.toLocaleString()} ชุด</small></dd></div>
          </dl>
        </div>
        {zeroOrgs > 0 && (
          <div className="hero-alert" role="status">
            <span className="alert-num">{zeroOrgs}</span>
            <p><b>หน่วยงานยังไม่มีข้อมูลปี {cur} เลย</b><span>ต้องติดตามให้อัปโหลดใน GD Catalog</span></p>
            <button type="button" className="btn-ghost" onClick={onShowZero}>ดูรายชื่อ <Icon name="arrow_forward" /></button>
          </div>
        )}
        <button type="button" className="hero-toggle icon-btn" onClick={() => setCompact(!compact)}
          aria-label={compact ? "ขยายส่วนหัว" : "ย่อส่วนหัว"} title={compact ? "ขยายส่วนหัว" : "ย่อส่วนหัว"}>
          <Icon name={compact ? "unfold_more" : "unfold_less"} />
        </button>
      </section>
      <div ref={sentinel} className="hero-sentinel" aria-hidden="true" />
      {/* แถบบางที่โผล่เมื่อเลื่อนผ่านส่วนหัว — ไม่เปลี่ยนความสูงหน้า จึงไม่กระตุก */}
      <div className={"hero-mini" + (scrolled ? " on" : "")} aria-hidden={!scrolled}>
        <b>หนองบัวลำภู</b>
        <span className="amber-t">มีปี {cur} {Math.round(total.pCur * 100)}%</span>
        <span className="blue-t">ผ่านครบ {Math.round(total.pPass * 100)}%</span>
        <span className="sub">{total.n.toLocaleString()} ชุดข้อมูล</span>
      </div>
    </>
  );
}
