import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden py-14 lg:py-20">
      <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_440px]">
        <div>
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-2">
            <LogoMark size={40} />
          </span>
          <h1 className="font-display mt-6 text-3xl font-black text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-8 text-slate-300">
            {subtitle}
          </p>

          <div className="mt-8 space-y-2.5 border-t border-white/10 pt-6">
            {[
              "حساب واحد يفتح لك كل المكتبات التي اشتريتها بضغطة واحدة.",
              "وصول دائم ومستمر من الكمبيوتر والموبايل في أي وقت.",
              "حماية متقدمة للمحتوى مع قارئ داخلي وعلامة مائية باسمك.",
            ].map((t) => (
              <p key={t} className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>{t}</span>
              </p>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            <Link href="/" className="text-cyan-300 underline hover:text-cyan-200">
              العودة إلى الصفحة الرئيسية
            </Link>
          </p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <span className="chip text-[11px]">ACCOUNT ACCESS</span>
            <span className="text-[11px] text-slate-400">حماية للحساب</span>
          </div>

          {children}

          {footer && (
            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
