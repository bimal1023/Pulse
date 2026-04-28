import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runAgentPrompt } from "../_proxy";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { researchInterest, profile } = await req.json();
  if (!researchInterest?.trim()) {
    return NextResponse.json(
      { error: "Research interest is required." },
      { status: 400 }
    );
  }

  const prompt = `Find relevant PhD fellowships, grants, and funding opportunities for a student with the following profile.

Research Interest: ${researchInterest}
${profile ? `Profile: ${profile}` : ""}

List 6–10 fellowships with:
- **Fellowship Name** and sponsoring organization
- **Eligibility** requirements
- **Award amount** (if known)
- **Deadline** (if known)
- **Why it fits** this student's profile

Include both prestigious national fellowships (NSF GRFP, Hertz, Ford, etc.) and field-specific ones. Format as a numbered list.`;

  try {
    const result = await runAgentPrompt(prompt);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to find fellowships. Please try again." },
      { status: 500 }
    );
  }
}
