import { NextResponse } from 'next/server'

// Este webhook era de Clerk — ya no se usa
export async function POST() {
  return NextResponse.json({ ok: true })
}