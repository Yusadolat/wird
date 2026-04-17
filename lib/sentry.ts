import * as Sentry from "@sentry/react-native";

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: Sentry.SeverityLevel;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.length > 0) {
    return new Error(error);
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      status?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts: string[] = [];
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      parts.push(candidate.message);
    }
    if (candidate.code != null) parts.push(`code=${String(candidate.code)}`);
    if (candidate.status != null) parts.push(`status=${String(candidate.status)}`);
    if (typeof candidate.details === "string" && candidate.details.length > 0) {
      parts.push(`details=${candidate.details}`);
    }
    if (typeof candidate.hint === "string" && candidate.hint.length > 0) {
      parts.push(`hint=${candidate.hint}`);
    }
    if (parts.length > 0) {
      const normalized = new Error(parts.join(" | "));
      normalized.name = "NonErrorException";
      return normalized;
    }
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return new Error(serialized);
      }
    } catch {
      // fall through
    }
  }

  return new Error("Non-Error exception (empty payload)");
}

export function captureException(error: unknown, context: CaptureContext = {}) {
  Sentry.captureException(normalizeError(error), {
    level: context.level,
    tags: context.tags,
    extra: context.extra,
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context: CaptureContext = {},
) {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags,
    extra: context.extra,
  });
}

export async function flush() {
  try {
    await Sentry.flush();
  } catch {
    // ignore
  }
}

