import Link from "next/link";
import { AlertCircle, UserPlus, Check } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { registerAction } from "@/app/actions";

export const metadata = { title: "إنشاء حساب جديد | SENSE" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="سجّل بريدك الإلكتروني وكلمة المرور، وسترتبط بك كل المكتبات التي تشتريها فورًا."
      footer={
        <p className="text-slate-400">
          لديك حساب بالفعل؟{" "}
          <Link href={`/login?next=${sp.next ?? ""}`} className="font-bold text-cyan-300 hover:underline">
            سجّل الدخول
          </Link>
        </p>
      }
    >
      {sp.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={15} />
          <span>{sp.error}</span>
        </div>
      )}

      <form action={registerAction} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? "/account"} />
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
        <div>
          <label className="field-label" htmlFor="password">
            كلمة المرور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="field text-sm"
            dir="ltr"
            placeholder="8 أحرف على الأقل"
          />
        </div>

        <div className="space-y-2 border-t border-white/10 pt-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Check size={13} className="text-cyan-300 shrink-0" />
            <span>يمكنك تأكيد بريدك عبر رابط يصل إلى صندوق الوارد عند تفعيل خدمة البريد.</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={13} className="text-cyan-300 shrink-0" />
            <span>إتاحة الحساب على الكمبيوتر والموبايل والتابلت.</span>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full text-xs sm:text-sm">
          <UserPlus size={16} />
          إنشاء الحساب
        </button>

        <p className="text-[11px] leading-5 text-slate-400">
          بإنشائك للحساب فأنت توافق على{" "}
          <Link href="/terms" className="text-cyan-300 underline">
            شروط الاستخدام
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="text-cyan-300 underline">
            سياسة الخصوصية
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
