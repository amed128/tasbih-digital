"use client";

import Link from "next/link";

type SettingsHeaderProps = {
  backLabel: string;
  backHref: string;
  parentLabel: string;
  parentHref: string;
  title: string;
  subtitle?: string;
};

export function SettingsHeader({
  backLabel,
  backHref,
  parentLabel,
  parentHref,
  title,
  subtitle,
}: SettingsHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      <Link href={backHref} className="mb-1 text-sm font-medium text-[var(--primary)]">
        {backLabel}
      </Link>
      <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
        <Link href={parentHref} className="hover:text-[var(--foreground)]">
          {parentLabel}
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{title}</span>
      </nav>
      <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
      {subtitle && <p className="text-sm text-[var(--secondary)]">{subtitle}</p>}
    </header>
  );
}
