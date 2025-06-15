import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword, createSession } from "@/lib/auth-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ success: false, error: "Password richiesta" }, { status: 400 })
    }

    if (!verifyPassword(password)) {
      return NextResponse.json({ success: false, error: "Password non valida" }, { status: 401 })
    }

    // Password corretta, crea sessione
    await createSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 })
  }
}
