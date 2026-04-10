import axios from "axios";

import { config } from "../lib/config";

export const quranApi = axios.create({
  baseURL: config.contentApiBaseUrl,
  timeout: 15000,
});

const quranAudioApi = axios.create({
  baseURL: "https://api.quran.com/api/v4",
  timeout: 15000,
});

type QuranWord = {
  char_type_name?: string;
  text?: string;
  text_uthmani?: string;
  translation?: {
    text?: string | null;
  };
};

type VerseAudioResponse = {
  verse_key: string;
  url: string;
};

type QuranVerseResponse = {
  id: number;
  verse_number: number;
  verse_key: string;
  page_number: number;
  juz_number: number;
  text_uthmani?: string;
  words?: QuranWord[];
};

export type QuranVerse = {
  id: number;
  verseNumber: number;
  verseKey: string;
  pageNumber: number;
  juzNumber: number;
  arabicText: string;
  translationText: string;
};

export type QuranChapter = {
  id: number;
  nameSimple: string;
  nameArabic: string;
  translatedName: string;
  versesCount: number;
};

type QuranChapterResponse = {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name?: {
    name?: string;
  };
  verses_count: number;
};

export type ChapterAudioTimestamps = {
  verseKey: string;
  timestampFrom: number;
  timestampTo: number;
  duration: number;
};

export type ChapterAudio = {
  audioUrl: string;
  timestamps: ChapterAudioTimestamps[];
};

export type QuranTafsir = {
  resourceName: string;
  text: string;
};

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function stripHtml(input: string) {
  return normalizeText(input.replace(/<[^>]+>/g, " "));
}

function toAbsoluteAudioUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://verses.quran.com/${url.replace(/^\/+/, "")}`;
}

function buildArabicText(verse: QuranVerseResponse) {
  if (verse.text_uthmani) {
    return normalizeText(verse.text_uthmani);
  }

  return normalizeText(
    (verse.words ?? [])
      .filter((word) => word.char_type_name !== "end")
      .map((word) => word.text_uthmani || word.text || "")
      .join(" "),
  );
}

function buildTranslationText(verse: QuranVerseResponse) {
  const translation = (verse.words ?? [])
    .filter((word) => word.char_type_name !== "end")
    .map((word) => word.translation?.text ?? "")
    .join(" ");

  return normalizeText(translation);
}

function mapVerse(verse: QuranVerseResponse): QuranVerse {
  return {
    id: verse.id,
    verseNumber: verse.verse_number,
    verseKey: verse.verse_key,
    pageNumber: verse.page_number,
    juzNumber: verse.juz_number,
    arabicText: buildArabicText(verse),
    translationText: buildTranslationText(verse),
  };
}

function mapChapter(chapter: QuranChapterResponse): QuranChapter {
  return {
    id: chapter.id,
    nameSimple: chapter.name_simple,
    nameArabic: chapter.name_arabic,
    translatedName: chapter.translated_name?.name ?? chapter.name_simple,
    versesCount: chapter.verses_count,
  };
}

export async function fetchVerseByKey(verseKey: string) {
  const response = await quranApi.get(`/verses/by_key/${verseKey}`, {
    params: {
      translations: config.defaultTranslationId,
      tafsirs: config.defaultTafsirId,
      words: true,
      word_fields: "text_uthmani",
    },
  });

  return response.data;
}

export async function fetchChapters() {
  const response = await quranApi.get("/chapters");

  return (response.data?.chapters ?? []).map(mapChapter) as QuranChapter[];
}

export async function fetchVerseRange(
  chapterNumber: number,
  startVerse: number,
  endVerse: number,
) {
  const response = await quranApi.get(`/verses/by_chapter/${chapterNumber}`, {
    params: {
      translations: config.defaultTranslationId,
      words: true,
      word_fields: "text_uthmani",
      per_page: 300,
      page: 1,
    },
  });

  return (response.data?.verses ?? [])
    .filter((verse: QuranVerseResponse) => {
      return (
        verse.verse_number >= startVerse && verse.verse_number <= endVerse
      );
    })
    .map(mapVerse) as QuranVerse[];
}

export async function fetchChapterById(chapterNumber: number) {
  const response = await quranApi.get(`/chapters/${chapterNumber}`);
  const chapter = response.data?.chapter;

  return mapChapter(chapter);
}

export async function fetchChapterAudio(
  recitationId: number,
  chapterNumber: number,
) {
  const response = await quranAudioApi.get(
    `/chapter_recitations/${recitationId}/${chapterNumber}`,
    {
      params: {
        segments: true,
      },
    },
  );

  const audioFile = response.data?.audio_file;

  return {
    audioUrl: audioFile.audio_url,
    timestamps: (audioFile.timestamps ?? []).map(
      (item: {
        verse_key: string;
        timestamp_from: number;
        timestamp_to: number;
        duration: number;
      }) => ({
        verseKey: item.verse_key,
        timestampFrom: item.timestamp_from,
        timestampTo: item.timestamp_to,
        duration: item.duration,
      }),
    ),
  } satisfies ChapterAudio;
}

export async function fetchTafsirByAyah(verseKey: string) {
  const response = await quranApi.get(
    `/tafsirs/${config.defaultTafsirId}/by_ayah/${verseKey}`,
  );

  const tafsir = response.data?.tafsir;

  return {
    resourceName: tafsir.resource_name,
    text: stripHtml(tafsir.text ?? ""),
  } satisfies QuranTafsir;
}

export async function fetchVerseAudioUrl(
  recitationId: number,
  verseKey: string,
) {
  const response = await quranAudioApi.get(
    `/recitations/${recitationId}/by_ayah/${verseKey}`,
  );

  const audioFile = (response.data?.audio_files ?? [])[0] as
    | VerseAudioResponse
    | undefined;

  if (!audioFile?.url) {
    return null;
  }

  return toAbsoluteAudioUrl(audioFile.url);
}
