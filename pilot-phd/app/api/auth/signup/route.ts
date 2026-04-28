import { NextRequest, NextResponse } from "next/server";
import { users } from "@/lib/store";
import { createSession, getUserByEmail, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  users.set(id, { id, name: name.trim(), email: email.trim().toLowerCase(), password, createdAt: Date.now() });

  const sessionId = createSession(id, email.trim().toLowerCase(), name.trim());

  const res = NextResponse.json({ ok: true, name: name.trim() });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
