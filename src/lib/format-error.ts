export function formatError(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) {
    return friendlySchemaMessage(error.message) ?? error.message;
  }
  if (typeof error === "object") {
    const maybe = error as {
      message?: unknown;
      error_description?: unknown;
      msg?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const code = typeof maybe.code === "string" ? maybe.code : "";
    const message =
      (typeof maybe.message === "string" && maybe.message) ||
      (typeof maybe.error_description === "string" &&
        maybe.error_description) ||
      (typeof maybe.msg === "string" && maybe.msg) ||
      "";

    if (
      code === "PGRST205" ||
      /Could not find the table/i.test(message) ||
      /schema cache/i.test(message)
    ) {
      return "Database tables are missing. Run the SQL files in supabase/ (001–004) in the Supabase SQL editor, then refresh.";
    }

    if (message) return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Something went wrong.";
  }
}

function friendlySchemaMessage(message: string): string | null {
  if (/Could not find the table/i.test(message) || /schema cache/i.test(message)) {
    return "Database tables are missing. Run the SQL files in supabase/ (001–004) in the Supabase SQL editor, then refresh.";
  }
  return null;
}
