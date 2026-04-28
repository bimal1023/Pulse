import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runAgentPrompt } from "../_proxy";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { statement } = await req.json();
  if (!statement?.trim()) {
    return NextResponse.json({ error: "Statement text is required." }, { status: 400 });
  }

  const prompt = `You are an expert PhD admissions advisor. Review and refine the following personal statement for a PhD application. Provide:

1. **Feedback** — 3–5 specific, actionable improvements (structure, clarity, impact, specificity)
2. **Refined Version** — a polished rewrite that addresses the feedback while preserving the author's voice

Personal Statement:
---
${statement}
---

Format your response with clear ## Feedback and ## Refined Version sections.`;

  try {
    const result = await runAgentPrompt(prompt);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to refine statement. Please try again." },
      { status: 500 }
    );
  }
}
