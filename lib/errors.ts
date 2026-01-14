import { Data } from "effect";

// ============================================================================
// Configuration Errors
// ============================================================================

export class MissingEnvVarError extends Data.TaggedError("MissingEnvVarError")<{
  readonly name: string;
}> {
  get message() {
    return `Missing required environment variable: ${this.name}`;
  }
}

// ============================================================================
// Database Errors
// ============================================================================

export class DatabaseInitError extends Data.TaggedError("DatabaseInitError")<{
  readonly cause: unknown;
}> {
  get message() {
    return `Failed to initialize database: ${this.cause}`;
  }
}

export class DatabaseQueryError extends Data.TaggedError("DatabaseQueryError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Database ${this.operation} failed: ${this.cause}`;
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
  readonly cause: unknown;
}> {
  get message() {
    return "Invalid JSON body";
  }
}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly details: string;
}> {
  get message() {
    return `Validation failed: ${this.details}`;
  }
}

// ============================================================================
// XML Parsing Errors
// ============================================================================

export type XmlParseFailureReason =
  | "invalid_xml"
  | "missing_transaction_list"
  | "missing_statement"
  | "invalid_transaction_subtype"
  | "invalid_transaction_type"
  | "invalid_booking_type";

export class XmlParseError extends Data.TaggedError("XmlParseError")<{
  readonly reason: XmlParseFailureReason;
  readonly details?: string;
}> {
  get message() {
    const messages: Record<XmlParseFailureReason, string> = {
      invalid_xml: "Failed to parse XML content",
      missing_transaction_list: "No transaction list found in XML",
      missing_statement: "Transaction missing statement data",
      invalid_transaction_subtype: "Invalid transaction subtype",
      invalid_transaction_type: "Invalid transaction type (expected 'cash')",
      invalid_booking_type: "Invalid booking type (expected 'cash')",
    };
    return this.details
      ? `${messages[this.reason]}: ${this.details}`
      : messages[this.reason];
  }
}

// ============================================================================
// AI/API Errors
// ============================================================================

export class AIRequestError extends Data.TaggedError("AIRequestError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {
  get message() {
    return `AI ${this.operation} failed: ${this.cause}`;
  }
}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly url: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Network request to ${this.url} failed: ${this.cause}`;
  }
}

export class ApiResponseError extends Data.TaggedError("ApiResponseError")<{
  readonly status: number;
  readonly message: string;
}> {
  get errorMessage() {
    return `API error (${this.status}): ${this.message}`;
  }
}

// ============================================================================
// File System Errors
// ============================================================================

export class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Failed to read file at ${this.path}: ${this.cause}`;
  }
}

// ============================================================================
// Union Types for Error Handling
// ============================================================================

export type ConfigError = MissingEnvVarError;

export type DataAccessError = DatabaseInitError | DatabaseQueryError;

export type InputError = JsonParseError | ValidationError | XmlParseError;

export type ExternalServiceError =
  | AIRequestError
  | NetworkError
  | ApiResponseError;
