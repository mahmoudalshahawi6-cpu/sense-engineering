import { Mail, Phone, MapPin, Clock3, Send } from "lucide-react";
import { SITE } from "@/lib/data";
import { contactAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "تواصل معنا | SENSE",
  description: "تواصل مع فريق الدعم للاستفسار عن المكتبات الرقمية أو الطلبات أو الدفع.",
};

const socials: { label: string; href: string; handle: string }[] = [];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="container-page py-12 space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-12">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="max-w-2xl">
          <span className="chip mb-3">CONTACT · تواصل معنا</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-4xl">
            نحن هنا لمساعدتك
          </h1>
          <p className="mt-3 text-sm leading-8 text-slate-300">
            لديك سؤال عن محتوى المكتبة، طريقة الشراء، أو ترغب في الاستفسار عن التحويل؟ أرسل لنا رسالة وسنرد عليك في أقرب وقت.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Form Card */}
        <div className="card-surface p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-white">أرسل رسالة سريعة</h2>

          {sp.sent && (
            <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3.5 text-xs text-cyan-200">
              تم استلام رسالتك بنجاح! سيتواصل معك فريق الدعم قريبًا.
            </div>
          )}
          {sp.error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              {sp.error}
            </div>
          )}

          <form action={contactAction} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="name">
                  الاسم الكامل
                </label>
                <input id="name" name="name" required className="field text-sm" placeholder="مثال: أحمد محمود" />
              </div>
              <div>
                <label className="field-label" htmlFor="email">
                  البريد الإلكتروني
                </label>
                <input id="email" name="email" type="email" required className="field text-sm" dir="ltr" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="subject">
                الموضوع
              </label>
              <input id="subject" name="subject" className="field text-sm" placeholder="استفسار عن محتوى مكتبة الميكاترونكس" />
            </div>

            <div>
              <label className="field-label" htmlFor="message">
                الرسالة
              </label>
              <textarea id="message" name="message" rows={5} required className="field text-sm" placeholder="اكتب استفسارك هنا…" />
            </div>

            <button type="submit" className="btn-primary text-xs">
              <Send size={15} />
              إرسال الرسالة
            </button>
          </form>
        </div>

        {/* Info Column */}
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-4">
            <h3 className="font-display text-base font-extrabold text-white">بيانات التواصل الرسمية</h3>

            <div className="space-y-3 text-xs text-slate-300">
              {SITE.email && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Mail size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">البريد الإلكتروني</span>
                  <a href={`mailto:${SITE.email}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">{SITE.email}</a>
                </div>
              </div>}

              {SITE.phone && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Phone size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">الموبايل والواتساب</span>
                  <a href={`tel:${SITE.phone}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">{SITE.phone}</a>
                </div>
              </div>}

              {SITE.address && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <MapPin size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">المقر</span>
                  <span className="font-bold text-white">{SITE.address}</span>
                </div>
              </div>}

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Clock3 size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">ساعات المتابعة</span>
                  <span className="font-bold text-white">يوميًا من 10 صباحًا حتى 10 مساءً</span>
                </div>
              </div>
            </div>
          </div>

          {socials.length > 0 && <div className="card-surface p-6">
            <h3 className="font-display text-base font-extrabold text-white">منصات التواصل</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  <span className="font-bold block">{s.label}</span>
                  <span className="text-[10px] text-slate-400" dir="ltr">
                    {s.handle}
                  </span>
                </a>
              ))}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
