import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.5" />
    </svg>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.75 19c.6-3 2.6-4.75 5.25-4.75S13.65 16 14.25 19" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M15.5 14.35c2.1.35 3.5 1.9 3.95 4.15" />
    </svg>
  );
}

export function ProductsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M12 12.5V21" />
    </svg>
  );
}

export function OrdersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.5h11v17l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5v-17z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  );
}

export function InventoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1" />
      <rect x="3.5" y="10" width="17" height="4.5" rx="1" />
      <rect x="3.5" y="16" width="17" height="4.5" rx="1" />
    </svg>
  );
}

export function PriorityIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 8a8 8 0 0 0-13.86-5.4M4 4v4h4" />
      <path d="M4 16a8 8 0 0 0 13.86 5.4M20 20v-4h-4" />
    </svg>
  );
}

export function LogsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function DocsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6c-1.5-1.1-3.6-1.6-6-1.6v13.2c2.4 0 4.5.5 6 1.6 1.5-1.1 3.6-1.6 6-1.6V4.4c-2.4 0-4.5.5-6 1.6Z" />
      <path d="M12 6v13.2" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3.5H5.5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1H9" />
      <path d="M16 16l4.5-4-4.5-4" />
      <path d="M20.25 12h-11" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.25" r="0.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h4.5l1.5 3h4l1.5-3H20" />
      <rect x="4" y="6" width="16" height="13" rx="1.5" />
      <path d="M8 6 6 12M16 6l2 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
