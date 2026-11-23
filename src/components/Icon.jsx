// ไอคอนจาก Google Material Symbols (https://fonts.google.com/icons)
export default function Icon({ name, className = "", fill = false }) {
  return (
    <span className={"msi " + (fill ? "fill " : "") + className} aria-hidden="true">
      {name}
    </span>
  );
}
