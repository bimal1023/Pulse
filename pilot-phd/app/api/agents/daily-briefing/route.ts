import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applications } from "@/lib/store";
import { runAgentPrompt } from "../_proxy";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userApps = Array.from(applications.values()).filter(
    (a) => a.userId === session.userId
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const appSummary =
    userApps.length > 0
      ? userApps
          .map(
            (a) =>
              `- ${a.university} (${a.program}): status=${a.status}, deadline=${a.deadline || "TBD"}`
          )
          .join("\n")
      : "No applications tracked yet.";

  const prompt = `Generate a motivating and practical PhD application daily briefing for ${today}.

The student's application portfolio:
${appSummary}

The briefing should include:
## 🌅 Good Morning, ${session.name}!
A warm, personalized opening for today.

## 📋 Application Status Snapshot
A brief summary of their portfolio and what stage they're at.

## ✅ Today's Top 3 Actions
Specific, actionable tasks they should do today based on their applications.

## 💡 Tip of the Day
One expert PhD application tip relevant to their current stage.

## 🎯 Motivation
A short inspiring message to keep them going.

Keep it energetic, practical, and under 400 words total.`;

  try {
    const result = await runAgentPrompt(prompt);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to generate briefing. Please try again." },
      { status: 500 }
    );
  }
}
