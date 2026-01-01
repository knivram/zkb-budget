import { z } from "zod";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export async function validateRequest<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      console.error("Validation failed:", result.error);
      return {
        success: false,
        response: Response.json(
          {
            error: "Validation failed",
            details: z.prettifyError(result.error),
          },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}
