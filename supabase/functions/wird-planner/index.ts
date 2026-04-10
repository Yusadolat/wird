const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MESSAGE = "Your plan has been updated — you're still on track.";
const DEFAULT_RATIONALE =
  "Today's wird was adapted from your goal, current pace, and recent reading consistency.";

function clampVerseTarget(value: number, remainingVerses: number) {
  return Math.max(1, Math.min(Math.round(value || 1), Math.max(remainingVerses, 1)));
}

function defaultMessageForMissedDays(missedDays: number) {
  if (missedDays <= 0) {
    return "Your wird is ready for today.";
  }

  if (missedDays <= 7) {
    return "Your plan has been updated — you're still on track.";
  }

  return "Welcome back. Your wird is ready.";
}

function sanitizeMessage(message: string, missedDays: number) {
  const normalized = String(message).trim();

  if (
    !normalized ||
    /(great|wonderful|awesome|amazing|fantastic|keep up)/i.test(normalized)
  ) {
    return defaultMessageForMissedDays(missedDays);
  }

  return normalized;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await request.json();
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    const remainingVerses = Number(payload.remainingVerses ?? 1);
    const baselineTarget = clampVerseTarget(
      Number(payload.dailyVerseTarget ?? 1),
      remainingVerses,
    );

    if (!openAiApiKey) {
      return Response.json(
        {
          targetVerseCount: baselineTarget,
          encouragementMessage: DEFAULT_MESSAGE,
          aiRationale: DEFAULT_RATIONALE,
          wasRecalibrated: Number(payload.missedDays ?? 0) > 0,
        },
        { headers: corsHeaders },
      );
    }

    const completionResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an Islamic productivity planner for a Quran habit app. Return JSON only with keys: targetVerseCount, encouragementMessage, aiRationale, wasRecalibrated. Keep encouragementMessage warm, short, calm, and non-shaming. Avoid exclamation marks, hype, generic praise, or motivational fluff. Keep aiRationale to one specific sentence explaining the adjustment. Never mention failure or guilt. Respect sustainable pacing.",
            },
            {
              role: "user",
              content: JSON.stringify({
                goalType: payload.goalType,
                targetDays: payload.targetDays,
                startDate: payload.startDate,
                dayNumber: payload.dayNumber,
                remainingVerses,
                remainingDays: payload.remainingDays,
                completedVerses: payload.completedVerses,
                missedDays: payload.missedDays,
                dailyVerseTarget: baselineTarget,
                lastSessionDate: payload.lastSessionDate,
                recentSessions: payload.recentSessions ?? [],
              }),
            },
          ],
        }),
      },
    );

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      console.error("[wird-planner] OpenAI error", errorText);

      return Response.json(
        {
          targetVerseCount: baselineTarget,
          encouragementMessage: DEFAULT_MESSAGE,
          aiRationale: DEFAULT_RATIONALE,
          wasRecalibrated: Number(payload.missedDays ?? 0) > 0,
        },
        { headers: corsHeaders },
      );
    }

    const completion = await completionResponse.json();
    const content = completion?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return Response.json(
      {
        targetVerseCount: clampVerseTarget(
          Number(parsed.targetVerseCount ?? baselineTarget),
          remainingVerses,
        ),
        encouragementMessage: sanitizeMessage(
          String(parsed.encouragementMessage ?? DEFAULT_MESSAGE),
          Number(payload.missedDays ?? 0),
        ),
        aiRationale: String(parsed.aiRationale ?? DEFAULT_RATIONALE),
        wasRecalibrated:
          typeof parsed.wasRecalibrated === "boolean"
            ? parsed.wasRecalibrated
            : Number(payload.missedDays ?? 0) > 0,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[wird-planner] unexpected failure", error);

    return Response.json(
      {
        targetVerseCount: 8,
        encouragementMessage: DEFAULT_MESSAGE,
        aiRationale: DEFAULT_RATIONALE,
        wasRecalibrated: false,
      },
      { headers: corsHeaders, status: 200 },
    );
  }
});
