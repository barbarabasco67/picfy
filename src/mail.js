// Envío de emails con Resend (https://resend.com). Si no hay clave configurada, no envía y devuelve false.
export async function sendMail(env, { to, subject, html, text, replyTo }) {
  if (!env.RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM || 'Picfy <onboarding@resend.dev>', to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return r.ok;
  } catch { return false; }
}
