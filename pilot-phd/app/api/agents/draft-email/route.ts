import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runAgentPrompt } from "../_proxy";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { professorName, university, researchInterest, statementSnippet } =
    await req.json();

  if (!professorName?.trim() || !university?.trim()) {
    return NextResponse.json(
      { error: "Professor name and university are required." },
      { status: 400 }
    );
  }

  const prompt = [
    `Draft a professional and personalized PhD inquiry email to Professor ${professorName} at ${university}.`,
    researchInterest ? `Research interest: ${researchInterest}.` : "",
    statementSnippet
      ? `Here is a snippet from my personal statement to incorporate naturally: "${statementSnippet}"`
      : "",
    "Make the email concise (3–4 paragraphs), specific about why this professor, and end with a clear call to action.",
    "Format the email with Subject: on the first line, then a blank line, then the body.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const result = await runAgentPrompt(prompt);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to generate email. Please try again." },
      { status: 500 }
    );
  }
}
