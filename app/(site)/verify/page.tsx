export const metadata = { title: "تأكيد البريد الإلكتروني" };

export default function VerifyNoticePage() {
  return (
    <section className="mx-auto max-w-[760px] px-5 py-20">
      <p className="tech-label text-blueprint">EMAIL VERIFICATION</p>
      <h1 className="mt-4 text-[clamp(1.8rem,3.4vw,2.5rem)]">تأكيد البريد الإلكتروني</h1>
      <p className="mt-5 text-[1.02rem] leading-9 text-slateink">
        يُرسل رابط التأكيد إلى بريدك الإلكتروني عند إنشاء الحساب. اضغط على الرابط لإتمام تفعيل
        حسابك. يمكنك أيضًا تأكيد البريد من صفحة حسابك في أي وقت.
      </p>
    </section>
  );
}
