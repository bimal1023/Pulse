import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applications, type AppStatus } from "@/lib/store";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = applications.get(params.id);
  if (!app || app.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = {
    ...app,
    university: body.university?.trim() ?? app.university,
    program: body.program?.trim() ?? app.program,
    deadline: body.deadline ?? app.deadline,
    interest: body.interest ?? app.interest,
    status: (body.status as AppStatus) ?? app.status,
    updatedAt: Date.now(),
  };
  applications.set(params.id, updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = applications.get(params.id);
  if (!app || app.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  applications.delete(params.id);
  return NextResponse.json({ ok: true });
}
