import { supabase } from "../lib/supabase";

export async function generateReflectionQuestion(
  tafsirText: string,
  verseRange: string,
) {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke("reflection", {
      body: {
        tafsirText,
        verseRange,
      },
    });

    if (!error && data?.reflectionQuestion) {
      return data.reflectionQuestion as string;
    }

    if (__DEV__ && error) {
      console.log("[Supabase Function] reflection failed", error.message);
    }
  }

  if (__DEV__) {
    console.log(
      "[Supabase Function] reflection unavailable; returning fallback prompt",
    );
  }

  return `What is one concrete way ${verseRange} can shape your day today?`;
}
