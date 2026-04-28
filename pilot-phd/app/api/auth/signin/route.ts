import { NextRequest, NextResponse } from "next/server";
import { createSession, getUserByEmail, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const sessionId = createSession(user.id, user.email, user.name);

  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
