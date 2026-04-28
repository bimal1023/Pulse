import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applications, type AppStatus } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userApps = Array.from(applications.values())
    .filter((a) => a.userId === session.userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json(userApps);
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { university, program, deadline, interest, status } = await req.json();
  if (!university?.trim() || !program?.trim()) {
    return NextResponse.json({ error: "University and program are required." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const app = {
    id,
    userId: session.userId,
    university: university.trim(),
    program: program.trim(),
    deadline: deadline ?? "",
    interest: interest ?? "",
    status: (status as AppStatus) ?? "planning",
    createdAt: now,
    updatedAt: now,
  };
  applications.set(id, app);
  return NextResponse.json(app, { status: 201 });
}
