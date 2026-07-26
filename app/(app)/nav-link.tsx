"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-ink text-white" : "text-ink hover:bg-black/5"
      }`}
    >
      {children}
    </Link>
  );
}
