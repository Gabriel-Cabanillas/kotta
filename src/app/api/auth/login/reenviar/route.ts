import { reenviarCodigo } from '@/lib/otp-resend'

export async function POST(req: Request) {
  return reenviarCodigo(req, 'LOGIN')
}
