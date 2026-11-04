import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Users,
  LibraryBig,
  UploadCloud,
  Settings,
  MessageSquare,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "الإحصائيات", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات والمدفوعات", Icon: Receipt },
  { href: "/admin/users", label: "المستخدمون", Icon: Users },
  { href: "/admin/libraries", label: "إدارة المكتبات", Icon: LibraryBig },
  { href: "/admin/content", label: "رفع الملفات", Icon: UploadCloud },
  { href: "/admin/settings", label: "الإعدادات والدفع", Icon: Settings },
  { href: "/admin/messages", label: "رسائل التواصل", Icon: MessageSquare },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-s border-white/10 bg-navy-900/90 text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-1">
            <LogoMark size={28} />
          </span>
          <div>
            <span className="chip text-[10px]">ADMIN</span>
            <p className="font-display text-xs font-bold text-white">لوحة التحكم</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
            >
              <item.Icon size={16} className="text-cyan-300" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 space-y-2">
          <a
            href="/api/download"
            download="engineering-digital-libraries.zip"
            className="btn-primary w-full justify-center text-xs !py-2 !px-3 text-center"
          >
            <Download size={14} />
            <span>تحميل كود المشروع (ZIP)</span>
          </a>
          <Link
            href="/"
            className="btn-ghost w-full justify-between text-xs !py-2 !px-3"
          >
            <span>العودة للموقع</span>
            <ArrowUpRight size={14} />
          </Link>
          <p className="mt-2 font-tech text-[11px] text-slate-400 truncate text-center">
            {user.name} · {user.email}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 bg-navy-900/90 px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/api/download"
              download="engineering-digital-libraries.zip"
              className="shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200"
            >
              📥 تحميل كود ZIP
            </a>
          </div>
        </div>
        <main className="flex-1 px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
