import { NextRequest } from "next/server";
import { sessions, users, type Session } from "./store";

export const SESSION_COOKIE = "pilot_session";

export function getSession(req: NextRequest): Session | null {
  const id = req.cookies.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return sessions.get(id) ?? null;
}

export function createSession(
  userId: string,
  email: string,
  name: string
): string {
  const id = crypto.randomUUID();
  sessions.set(id, { userId, email, name, createdAt: Date.now() });
  return id;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

export function getUserByEmail(email: string) {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) return user;
  }
  return null;
}
