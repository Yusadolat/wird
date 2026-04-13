import * as Sentry from "@sentry/react-native";

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Non-Error exception");
  }
}

export function captureException(error: unknown, context: CaptureContext = {}) {
  Sentry.captureException(normalizeError(error), {
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

