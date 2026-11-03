import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { loginAction } from "@/app/actions";

export const metadata = { title: "تسجيل الدخول | SENSE" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string; verified?: string; verify?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="ادخل إلى حسابك للوصول إلى المكتبات التي اشتريتها ومتابعة طلباتك."
      footer={
        <p className="text-slate-400">
          ليس لديك حساب؟{" "}
          <Link href={`/register?next=${sp.next ?? ""}`} className="font-bold text-cyan-300 hover:underline">
            أنشئ حسابًا جديدًا
          </Link>
        </p>
      }
    >
      {sp.reset && (
        <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs text-cyan-200">
          تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.
        </div>
      )}
      {sp.verified && (
        <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs text-cyan-200">
          تم تأكيد بريدك الإلكتروني بنجاح. سجّل الدخول للمتابعة.
        </div>
      )}
      {sp.verify === "invalid" && (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          رابط التأكيد غير صالح أو انتهت صلاحيته. سجّل الدخول واطلب رابطًا جديدًا من صفحة حسابك.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={15} />
          <span>{sp.error}</span>
        </div>
      )}

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? "/account"} />
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
          <input id="password" name="password" type="password" required className="field text-sm" dir="ltr" />
        </div>
        <button type="submit" className="btn-primary w-full text-xs sm:text-sm">
          <LogIn size={16} />
          تسجيل الدخول
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/forgot-password" className="text-xs text-cyan-300 hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </p>
    </AuthShell>
  );
}
