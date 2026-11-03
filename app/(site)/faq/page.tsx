import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { SITE } from "@/lib/data";
import { FaqJsonLd } from "@/components/JsonLd";

export const metadata = {
  title: "الأسئلة الشائعة | SENSE",
  description: "إجابات على أكثر الأسئلة شيوعًا حول المكتبات الرقمية، الشراء، الدفع، وحماية المحتوى.",
};

const groups = [
  {
    title: "الشراء والدفع",
    id: "payment",
    items: [
      {
        q: "هل الاشتراك شهري أو سنوي؟",
        a: "لا. المنصة تعتمد نظام الشراء مرة واحدة: تدفع قيمة المكتبة مرة واحدة فقط، ويظل الوصول إليها دائمًا من خلال حسابك دون أي رسوم متكررة أو تجديد.",
      },
      {
        q: "ما هي طرق الدفع المتاحة؟",
        a: "تظهر في صفحة الشراء وسائل الدفع التي تجهزها الإدارة فقط، مثل InstaPay أو المحافظ الإلكترونية أو التحويل البنكي، مع بيانات التحويل بعد تسجيل الدخول.",
      },
      {
        q: "متى تُفعّل المكتبة بعد الشراء؟",
        a: "بعد رفع صورة إثبات التحويل يُنشأ طلب بحالة «بانتظار مراجعة الدفع». يراجع المدير الإثبات يدويًا، وعند الموافقة تُفعّل المكتبة فورًا وتصلك رسالة بالتفعيل.",
      },
      {
        q: "ماذا لو تم رفض طلبي؟",
        a: "ستظهر لك رسالة تتضمن سبب الرفض داخل صفحة تفاصيل الطلب، ويمكنك إعادة إرسال طلب جديد بصورة إثبات صحيحة في أي وقت.",
      },
      {
        q: "هل يمكنني استرجاع المبلغ؟",
        a: "يمكنك تقديم طلب مراجعة عبر صفحة التواصل في حال وجود مشكلة تقنية جوهرية، وتُطبق سياسة الاسترداد النهائية المعتمدة والمعلنة قبل الشراء.",
      },
    ],
  },
  {
    title: "المحتوى والمكتبات",
    id: "content",
    items: [
      {
        q: "هل يمكنني مشاهدة محتوى المكتبة قبل الشراء؟",
        a: "نعم. كل مكتبة تحتوي على فيديو معاينة مجاني يشرح المحتوى وطريقة تنظيم الملفات وكيفية الاستفادة منها، إضافة إلى نبذة عامة وفهرس الأقسام المنشورة.",
      },
      {
        q: "هل يتم تحديث المحتوى بعد الشراء؟",
        a: "نعم، كل مكتبة تحتوي على قسم «التحديثات» يُضاف إليه المحتوى الجديد باستمرار، ويصل إليك داخل حسابك بدون أي رسوم إضافية.",
      },
      {
        q: "هل المحتوى مناسب للمبتدئين؟",
        a: "كل مكتبة تبدأ بقسم «ابدأ من هنا» ودليل القسم، ثم تتدرج في المستويات حتى المشروعات العملية، لذا تناسب المبتدئ والمتوسط والمتقدم.",
      },
      {
        q: "هل أحتاج برامج خاصة لتشغيل الملفات؟",
        a: "لا. المحتوى يُعرض داخل الموقع عبر قارئ مدمج، والروابط الخارجية تشير إلى المواقع الرسمية للبرامج والمصادر.",
      },
    ],
  },
  {
    title: "الحساب والحماية",
    id: "account",
    items: [
      {
        q: "كيف أستعيد كلمة المرور؟",
        a: "من صفحة تسجيل الدخول اختر «نسيت كلمة المرور؟»، ثم أدخل بريدك الإلكتروني. سيصلك رابط إعادة التعيين إذا كانت خدمة البريد مهيأة في المنصة.",
      },
      {
        q: "هل يمكنني استخدام حسابي على أكثر من جهاز؟",
        a: "نعم، يمكنك استخدام حسابك من الكمبيوتر والموبايل. للحفاظ على أمان المحتوى هناك حد لعدد الجلسات النشطة في نفس الوقت.",
      },
      {
        q: "كيف تحمون الملفات من المشاركة؟",
        a: "تُخزَّن الملفات في مساحة خاصة، ويتحقق الخادم من تسجيل الدخول وملكية المكتبة قبل عرض المحتوى، مع روابط مؤقتة وعلامة مائية. هذه الإجراءات تقلل المشاركة غير المصرح بها لكنها لا تمنع تصوير الشاشة بالكامل. لا توجد حماية تقنية تمنع تصوير الشاشة بشكل مطلق.",
      },
      {
        q: "هل بياناتي وصور إثبات التحويل آمنة؟",
        a: "نعم. صور الإثبات تُخزَّن في مساحة خاصة ولا يمكن الوصول إليها إلا من حسابك أو من إدارة المنصة، ولا تظهر في أي صفحة عامة.",
      },
    ],
  },
];

export default function FaqPage() {
  const allFaqItems = groups.flatMap((g) => g.items);

  return (
    <div className="container-page py-12 space-y-12">
      <FaqJsonLd items={allFaqItems} />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-12">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="max-w-2xl">
          <span className="chip mb-3">FAQ · الأسئلة الشائعة</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-4xl">
            إجابات واضحة قبل أن تبدأ
          </h1>
          <p className="mt-3 text-sm leading-8 text-slate-300">
            جمعنا هنا أكثر الأسئلة التي تصلنا حول الشراء والدفع والمحتوى والحماية. إن لم تجد إجابتك، فريق الدعم جاهز للمساعدة في أي وقت.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="btn-ghost !py-1.5 !px-3 text-xs"
              >
                {g.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        {groups.map((g) => (
          <div key={g.id} id={g.id} className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-xl font-extrabold text-cyan-300 border-b border-white/10 pb-3">
              {g.title}
            </h2>

            <div className="space-y-3">
              {g.items.map((item, i) => (
                <details
                  key={item.q}
                  open={i === 0 && g.id === "payment"}
                  className="card-surface group p-5 transition hover:border-cyan-400/35"
                >
                  <summary className="flex items-center justify-between gap-4 font-display text-sm font-bold text-white sm:text-base">
                    <span>{item.q}</span>
                    <span className="faq-sign text-xl font-bold text-cyan-300 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs sm:text-sm leading-7 text-slate-300">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className="card-surface p-8 text-center sm:p-10">
          <h3 className="font-display text-xl font-extrabold text-white">لم تجد إجابة لسؤالك؟</h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-300">
            تواصل مباشرة مع إدارة المنصة وسنوضح لك أي استفسار فورًا.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary text-xs">
              تواصل معنا
              <ArrowLeft size={15} />
            </Link>
            <a href={`mailto:${SITE.email}`} className="btn-ghost text-xs">
              <Mail size={15} />
              راسلنا بالبريد
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
