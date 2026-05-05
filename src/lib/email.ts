import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarCodigoVerificacion(
  email: string,
  codigo: string,
  tipo: 'registro' | 'login'
) {
  const asunto = tipo === 'registro'
    ? 'Verifica tu cuenta en KOTTA'
    : 'Código de acceso KOTTA'

  const mensaje = tipo === 'registro'
    ? 'Usa este código para verificar tu cuenta'
    : 'Usa este código para iniciar sesión'

  const { data, error } = await resend.emails.send({
    from:    'KOTTA <onboarding@resend.dev>',
    to:      email,
    subject: asunto,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #F7F9FC;">
        <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0;">
          <div style="width: 48px; height: 48px; background: #1E3A5F; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <span style="color: #4FA8E8; font-size: 24px; font-weight: bold;">K</span>
          </div>
          <h1 style="color: #0F1F34; font-size: 22px; margin: 0 0 8px;">KOTTA</h1>
          <p style="color: #4A5568; font-size: 15px; margin: 0 0 32px;">${mensaje}</p>
          <div style="background: #E8F0F9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <p style="color: #6B7A99; font-size: 13px; margin: 0 0 8px;">Tu código de verificación</p>
            <p style="color: #1E3A5F; font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 0;">${codigo}</p>
          </div>
          <p style="color: #6B7A99; font-size: 13px; margin: 0;">Este código expira en <strong>10 minutos</strong>. Si no solicitaste esto, ignora este correo.</p>
        </div>
        <p style="color: #6B7A99; font-size: 11px; text-align: center; margin-top: 24px;">KOTTA · Tu comunidad, bajo control.</p>
      </div>
    `,
  })

  if (error) {
    console.error('❌ Resend error:', JSON.stringify(error, null, 2))
    throw new Error(error.message)
  }

  console.log('✅ Email enviado, ID:', data?.id)
}

export async function enviarInvitacion(
  email: string,
  nombre: string,
  orgName: string,
  token: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/invitacion?token=${token}`

  const { data, error } = await resend.emails.send({
    from:    'KOTTA <onboarding@resend.dev>',
    to:      email,
    subject: `Te invitaron a ${orgName} en KOTTA`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #F7F9FC;">
        <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0;">
          <div style="width: 48px; height: 48px; background: #1E3A5F; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <span style="color: #4FA8E8; font-size: 24px; font-weight: bold;">K</span>
          </div>
          <h1 style="color: #0F1F34; font-size: 22px; margin: 0 0 8px;">Hola, ${nombre}</h1>
          <p style="color: #4A5568; font-size: 15px; margin: 0 0 8px;">Te han invitado a formar parte de <strong>${orgName}</strong> en KOTTA.</p>
          <p style="color: #4A5568; font-size: 15px; margin: 0 0 32px;">Haz clic en el botón para activar tu cuenta y crear tu contraseña.</p>
          <a href="${link}" style="display: block; background: #1E3A5F; color: white; text-decoration: none; padding: 16px 24px; border-radius: 10px; text-align: center; font-size: 15px; font-weight: 500; margin-bottom: 24px;">
            Activar mi cuenta
          </a>
          <p style="color: #6B7A99; font-size: 13px; margin: 0;">Este link expira en <strong>48 horas</strong>. Si no esperabas esta invitación, ignora este correo.</p>
        </div>
        <p style="color: #6B7A99; font-size: 11px; text-align: center; margin-top: 24px;">KOTTA · Tu comunidad, bajo control.</p>
      </div>
    `,
  })

  if (error) {
    console.error('❌ Resend error:', JSON.stringify(error, null, 2))
    throw new Error(error.message)
  }

  console.log('✅ Invitación enviada, ID:', data?.id)
}