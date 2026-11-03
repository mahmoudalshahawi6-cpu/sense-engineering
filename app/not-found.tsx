import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-20 text-white">
      <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
      <div className="card-surface relative max-w-lg p-8 sm:p-12 text-center space-y-4">
        <p className="font-tech text-6xl sm:text-7xl font-black leading-none text-cyan-300">404</p>
        <h1 className="font-display text-2xl font-black text-white">الصفحة غير موجودة</h1>
        <p className="text-sm leading-7 text-slate-300">
          ربما تم نقل الصفحة أو أن الرابط غير صحيح. يمكنك العودة إلى الرئيسية أو تصفح المكتبات المتاحة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/" className="btn-primary text-xs">
            <Home size={15} />
            الرئيسية
          </Link>
          <Link href="/libraries" className="btn-ghost text-xs">
            المكتبات
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
