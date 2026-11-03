"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogOut, UserRound, LibraryBig } from "lucide-react";
import { LogoCompact } from "./Logo";
import { logoutAction } from "@/app/actions";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/libraries", label: "المكتبات" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/faq", label: "الأسئلة الشائعة" },
];

export default function Header({
  user,
}: {
  user: { name: string; role: string } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="SENSE Engineering Digital Libraries" className="group flex items-center gap-3">
          <LogoCompact />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-300"
                >
                  <LayoutDashboard size={14} />
                  لوحة التحكم
                </Link>
              )}
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              >
                <UserRound size={14} />
                {user.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-white/20 hover:text-white"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut size={14} />
                  <span>خروج</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !py-2 !px-3.5 text-xs">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-primary !py-2 !px-4 text-xs">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-cyan-200"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute inset-x-0 top-0 h-0.5 rounded bg-current transition ${
                  open ? "top-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 top-[7px] h-0.5 rounded bg-current transition ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 top-[14px] h-0.5 rounded bg-current transition ${
                  open ? "top-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy-900/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5 hover:text-cyan-200"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/libraries"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-lg bg-cyan-400/10 px-3 py-2.5 text-sm font-bold text-cyan-300"
            >
              <LibraryBig size={16} /> استكشف المكتبات
            </Link>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="btn-ghost flex-1 text-center text-xs"
                  >
                    حسابي ({user.name.split(" ")[0]})
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="btn-primary flex-1 text-center text-xs"
                    >
                      لوحة التحكم
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-ghost flex-1 text-center text-xs"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary flex-1 text-center text-xs"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
