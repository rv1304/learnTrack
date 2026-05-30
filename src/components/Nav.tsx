"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Layers,
  FileText,
  Calendar,
  Bot,
  Settings,
  Zap,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";

const mainLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { href: "/pillars", label: "Pillars", icon: Layers, short: "Pillars" },
  { href: "/weekly", label: "Weekly Plan", icon: Calendar, short: "Weekly" },
  { href: "/notes", label: "Notes", icon: FileText, short: "Notes" },
];

const toolLinks = [
  { href: "/agent", label: "Bulk Import", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const [score, setScore] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((h) => {
        if (Array.isArray(h) && h.length) {
          setScore(h[h.length - 1].total);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const LinkItem = ({
    href,
    label,
    icon: Icon,
    onClick,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    onClick?: () => void;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-all ${
          active
            ? "bg-white text-black"
            : "text-[var(--muted-light)] active:bg-[var(--bg-hover)]"
        }`}
      >
        <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
        {label}
      </Link>
    );
  };

  const isMoreActive = toolLinks.some((l) => l.href === pathname);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] lg:flex">
        <div className="border-b border-[var(--border)] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Zap size={16} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">LearnTrack</h1>
              <p className="text-[11px] text-[var(--muted)]">Interview prep OS</p>
            </div>
          </div>
        </div>

        {score !== null && (
          <div className="mx-4 mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Overall Score
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{score}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {mainLinks.map((l) => (
              <li key={l.href}>
                <LinkItem href={l.href} label={l.label} icon={l.icon} />
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Tools
          </p>
          <ul className="space-y-0.5">
            {toolLinks.map((l) => (
              <li key={l.href}>
                <LinkItem href={l.href} label={l.label} icon={l.icon} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <p className="text-[11px] leading-relaxed text-[var(--muted)]">
            8 pillars · LeetCode · GitHub sync
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="mobile-header lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
            <Zap size={15} className="text-black" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">LearnTrack</p>
            <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">Interview prep</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {score !== null && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)]">Score</p>
              <p className="text-sm font-semibold tabular-nums leading-none">{score}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-icon"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav lg:hidden" aria-label="Main navigation">
        <ul>
          {mainLinks.map(({ href, icon: Icon, short }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link href={href} className={active ? "active" : ""}>
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                  <span>{short}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={isMoreActive ? "active" : ""}
              aria-label="More options"
            >
              <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.25 : 1.75} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Drawer overlay */}
      <div
        className={`mobile-drawer-overlay lg:hidden ${drawerOpen ? "block" : "hidden"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />

      {/* Drawer panel */}
      <aside
        className={`mobile-drawer lg:hidden ${drawerOpen ? "open" : "closed"}`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <p className="text-sm font-semibold">Menu</p>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="btn-icon !border-0"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Tools
          </p>
          <ul className="space-y-1">
            {toolLinks.map((l) => (
              <li key={l.href}>
                <LinkItem
                  href={l.href}
                  label={l.label}
                  icon={l.icon}
                  onClick={() => setDrawerOpen(false)}
                />
              </li>
            ))}
          </ul>

          {score !== null && (
            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Overall Score
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{score}</p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
