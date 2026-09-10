import { Resend } from 'resend'

type EmailEnvironment = Record<string, string | undefined>

export type NotificationEmailResult =
  | { status: 'DISABLED' }
  | { status: 'SENT'; providerId: string | null }
  | { status: 'FAILED' }

export function isNotificationEmailEnabled(env: EmailEnvironment = process.env) {
  return env.EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === 'true'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function notificationUrl(href: string | null, env: EmailEnvironment) {
  if (!href) return null
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? env.APP_URL
  if (!baseUrl) return null

  try {
    const url = new URL(href, baseUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function sendNotificationEmail(
  input: { to: string; recipientName: string; title: string; message: string; href: string | null },
  env: EmailEnvironment = process.env,
): Promise<NotificationEmailResult> {
  if (!isNotificationEmailEnabled(env)) return { status: 'DISABLED' }

  const apiKey = env.RESEND_API_KEY
  const from = env.EMAIL_NOTIFICATIONS_FROM
  if (!apiKey || !from) {
    console.error('Email de notificaciones habilitado sin RESEND_API_KEY o EMAIL_NOTIFICATIONS_FROM.')
    return { status: 'FAILED' }
  }

  const url = notificationUrl(input.href, env)
  const safeName = escapeHtml(input.recipientName)
  const safeTitle = escapeHtml(input.title)
  const safeMessage = escapeHtml(input.message).replaceAll('\n', '<br />')
  const safeUrl = url ? escapeHtml(url) : null

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.title,
      html: `
        <div style="margin:0;background:#f7f8fa;padding:40px 20px;font-family:Arial,sans-serif;color:#171717">
          <div style="margin:0 auto;max-width:560px;border:1px solid #e5e5e5;border-radius:16px;background:#ffffff;padding:32px">
            <p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#737373">Kotta</p>
            <p style="margin:0 0 8px;font-size:14px;color:#737373">Hola, ${safeName}</p>
            <h1 style="margin:0;font-size:24px;line-height:1.25;color:#171717">${safeTitle}</h1>
            <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#525252">${safeMessage}</p>
            ${safeUrl ? `<a href="${safeUrl}" style="display:inline-block;margin-top:24px;border-radius:10px;background:#171717;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">Abrir en Kotta</a>` : ''}
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend no pudo entregar una notificación.', error.name)
      return { status: 'FAILED' }
    }
    return { status: 'SENT', providerId: data?.id ?? null }
  } catch (error) {
    console.error('Error inesperado al enviar una notificación por email.', error instanceof Error ? error.name : 'UnknownError')
    return { status: 'FAILED' }
  }
}
