import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { LogoCompact } from "./Logo";
import { SITE } from "@/lib/data";

const socials: { href: string; label: string; char: string }[] = [];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-navy-900/70">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        {/* Col 1 */}
        <div className="space-y-4">
          <Link href="/" aria-label="SENSE Engineering Digital Libraries">
            <LogoCompact />
          </Link>
          <p className="text-sm leading-7 text-slate-400">
            منصة عربية متخصصة في بيع وعرض المكتبات الرقمية الهندسية: كورسات، كتب ومراجع، برامج هندسية، مشروعات عملية، ومسارات تعلم منظمة لطلاب وخريجي الهندسة.
          </p>
          {socials.length > 0 && <div className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-xs font-extrabold uppercase text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
              >
                {s.char}
              </a>
            ))}
          </div>}
        </div>

        {/* Col 2 */}
        <div>
          <h3 className="mb-4 font-display text-sm font-extrabold text-white">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/libraries" className="transition hover:text-cyan-300">
                المكتبات
              </Link>
            </li>
            <li>
              <Link href="/account" className="transition hover:text-cyan-300">
                حسابي
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-cyan-300">
                من نحن
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-cyan-300">
                تواصل معنا
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition hover:text-cyan-300">
                الأسئلة الشائعة
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h3 className="mb-4 font-display text-sm font-extrabold text-white">المكتبات</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/library/mechatronics" className="transition hover:text-cyan-300">
                Mechatronics Digital Library
              </Link>
            </li>
            <li>
              <Link href="/library/mechanical" className="transition hover:text-cyan-300">
                Mechanical Engineering Library
              </Link>
            </li>
            <li>
              <Link href="/library/electrical" className="transition hover:text-cyan-300">
                Electrical Engineering Library
              </Link>
            </li>
            <li>
              <Link href="/library/programming" className="transition hover:text-cyan-300">
                Programming Digital Library
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h3 className="mb-4 font-display text-sm font-extrabold text-white">السياسات والدعم</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/privacy" className="transition hover:text-cyan-300">
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-cyan-300">
                شروط الاستخدام
              </Link>
            </li>
            <li>
              <Link href="/refund" className="transition hover:text-cyan-300">
                سياسة الاسترداد والاسترجاع
              </Link>
            </li>
            {SITE.email && <li className="pt-2 text-xs text-slate-400">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 hover:text-cyan-300">
                <Mail size={13} className="text-cyan-400" />
                <span>{SITE.email}</span>
              </a>
            </li>}
            {SITE.phone && <li className="text-xs text-slate-400">
              <a href={`tel:${SITE.phone}`} className="flex items-center gap-1.5 hover:text-cyan-300" dir="ltr">
                <Phone size={13} className="text-cyan-400" />
                <span>{SITE.phone}</span>
              </a>
            </li>}
            <li className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={13} className="text-cyan-400" />
              <span>{SITE.address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Official Trust & Accreditation Badges */}
      <div className="border-t border-white/10 bg-navy-950/40 py-5">
        <div className="container-page grid grid-cols-2 gap-3 sm:grid-cols-4 text-center text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-cyan-300 font-bold block">✓ محتوى تعليمي منظم</span>
            <span className="text-[10px] text-slate-400">مكتبات رقمية مستقلة حسب التخصص</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-emerald-400 font-bold block">🔒 وصول مرتبط بالحساب</span>
            <span className="text-[10px] text-slate-400">ملفات خاصة وصلاحيات للمشتركين</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-cyan-300 font-bold block">🛡️ حماية الملكية الفكرية</span>
            <span className="text-[10px] text-slate-400">علامة مائية مدمجة لحفظ الحقوق</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-amber-300 font-bold block">🧾 مراجعة وفحص مالي يدوي</span>
            <span className="text-[10px] text-slate-400">التحقق من صلاحية العضوية قبل فتح المحتوى</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-navy-950/80 py-6">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} — جميع الحقوق محفوظة. تشغيل وإدارة علامة {SITE.brand}.
          </p>
          <p className="font-tech text-[11px] text-cyan-400/80">
            SENSE · LIFETIME LIBRARY ACCESS · SECURE MEMBER AREA
          </p>
        </div>
      </div>
    </footer>
  );
}
