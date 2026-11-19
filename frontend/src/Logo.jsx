import { Link } from "react-router-dom";

export default function Logo({ light = false, to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt font-display text-lg font-bold text-white">
        p
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          light ? "text-white" : "text-ink"
        }`}
      >
        Portfolia
      </span>
    </Link>
  );
}
