/** Server-side transactional email helper. Uses Resend's HTTPS API without a client SDK. */
export type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailIsConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendTransactionalEmail(message: TransactionalEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] Provider rejected message (${response.status}): ${detail.slice(0, 240)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Could not send message:", error);
    return false;
  }
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export function brandedEmailHtml(title: string, body: string, actionLabel: string, actionUrl: string) {
  const safeTitle = escapeEmailHtml(title);
  const safeBody = escapeEmailHtml(body);
  const safeUrl = escapeEmailHtml(actionUrl);
  const safeLabel = escapeEmailHtml(actionLabel);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body style="margin:0;background:#f3f6fa;font-family:Arial,Tahoma,sans-serif;color:#162b42"><div style="max-width:600px;margin:32px auto;padding:28px;background:#fff;border:1px solid #dce5ee;border-radius:16px"><div style="font-size:24px;font-weight:800;letter-spacing:2px;color:#12324d">SENSE</div><div style="margin-top:4px;color:#52718a;font-size:12px">Engineering Digital Libraries</div><h1 style="font-size:22px;margin:28px 0 12px">${safeTitle}</h1><p style="font-size:15px;line-height:1.9">${safeBody}</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#087f8c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:9px;font-weight:700">${safeLabel}</a></p><p style="font-size:12px;line-height:1.8;color:#68798a">إذا لم تطلب هذه الرسالة، يمكنك تجاهلها. لا تشارك هذا الرابط مع أي شخص.</p><hr style="border:0;border-top:1px solid #e5edf3;margin:24px 0"><p style="font-size:11px;color:#8492a0">SENSE — Your Engineering Knowledge Hub</p></div></body></html>`;
}
