import { Effect } from "effect";
import { z } from "zod";
import { JsonParseError, ValidationError } from "@/lib/errors";

/**
 * Parse JSON from a Request body.
 * Returns an Effect that fails with JsonParseError if parsing fails.
 */
export const parseJsonBody = (
  request: Request
): Effect.Effect<unknown, JsonParseError> =>
  Effect.tryPromise({
    try: () => request.json(),
    catch: (error) => new JsonParseError({ cause: error }),
  });

/**
 * Validate data against a Zod schema.
 * Returns an Effect that fails with ValidationError if validation fails.
 */
export const validateSchema = <T extends z.ZodType>(
  schema: T,
  data: unknown
): Effect.Effect<z.infer<T>, ValidationError> =>
  Effect.try({
    try: () => {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    catch: (error) => {
      if (error instanceof z.ZodError) {
        return new ValidationError({ details: z.prettifyError(error) });
      }
      return new ValidationError({ details: String(error) });
    },
  });

/**
 * Validate a Request body against a Zod schema.
 * Combines JSON parsing and schema validation into a single Effect.
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 *   const data = yield* validateRequest(request, mySchema);
 *   // data is typed as z.infer<typeof mySchema>
 * });
 * ```
 */
export const validateRequest = <T extends z.ZodType>(
  request: Request,
  schema: T
): Effect.Effect<z.infer<T>, JsonParseError | ValidationError> =>
  Effect.gen(function* () {
    const body = yield* parseJsonBody(request);
    const data = yield* validateSchema(schema, body);
    return data;
  });

/**
 * Convert an input error to an HTTP Response.
 * Maps error types to appropriate HTTP status codes.
 */
export const inputErrorToResponse = (
  error: JsonParseError | ValidationError
): Response => {
  switch (error._tag) {
    case "JsonParseError":
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    case "ValidationError":
      return Response.json(
        { error: "Validation failed", details: error.details },
        { status: 400 }
      );
  }
};
