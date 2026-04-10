const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_QUESTION =
  "What does this passage invite to change in a concrete part of life today?";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tafsirText = "", verseRange = "" } = await request.json();
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      return Response.json(
        { reflectionQuestion: FALLBACK_QUESTION },
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
          max_tokens: 120,
          messages: [
            {
              role: "system",
              content:
                "You are a thoughtful Islamic scholar assistant. Based on the tafsir excerpt, generate exactly one introspective reflection question that is spiritually grounded, practical, and not preachy. Keep it to 1-2 sentences. Do not use the first-person pronoun.",
            },
            {
              role: "user",
              content: `Verses: ${verseRange}\n\nTafsir excerpt: ${String(tafsirText).slice(0, 800)}`,
            },
          ],
        }),
      },
    );

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      console.error("[reflection function] OpenAI error", errorText);

      return Response.json(
        { reflectionQuestion: FALLBACK_QUESTION },
        { headers: corsHeaders },
      );
    }

    const completion = await completionResponse.json();
    const reflectionQuestion =
      completion?.choices?.[0]?.message?.content?.trim() || FALLBACK_QUESTION;

    return Response.json(
      { reflectionQuestion },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[reflection function] unexpected failure", error);

    return Response.json(
      { reflectionQuestion: FALLBACK_QUESTION },
      { headers: corsHeaders, status: 200 },
    );
  }
});
