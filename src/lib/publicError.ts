/** Only deliberately raised domain errors may carry messages to authenticated users. */
export class PublicError extends Error {}

export function publicErrorMessage(error: unknown, fallback = "Unable to process request"): string {
  return error instanceof PublicError ? error.message : fallback;
}
