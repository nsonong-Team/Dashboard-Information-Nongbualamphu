import Icon from "./Icon.jsx";

// ส่วนหัว + ฉากหลังของ popover — บนมือถือ popover จะกลายเป็น bottom sheet (ดู mobile.css)
export function SheetBackdrop({ onClose }) {
  return <div className="sheet-bg" onClick={onClose} aria-hidden="true" />;
}

export function SheetHead({ title, onClose }) {
  return (
    <div className="sheet-head">
      <span className="sheet-grip" />
      <b>{title}</b>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
    </div>
  );
}
