# Effect Library Evaluation for Error Handling

This document evaluates where the ZKB Budget codebase could benefit from adopting the [Effect](https://effect.website/) library for improved error handling.

## What is Effect?

Effect is a TypeScript library that provides type-safe error handling through its core `Effect<Success, Error, Requirements>` type. Unlike traditional try-catch, Effect:

- **Tracks errors in the type system** - Errors become part of the function signature
- **Composes errors automatically** - Multiple error types form a union
- **Provides rich error handling operators** - `catchTag`, `catchAll`, `either`, etc.
- **Distinguishes recoverable errors from defects** - Expected vs unexpected failures

## Current Error Handling Patterns

### 1. API Routes (High Improvement Potential)

**File:** `app/api/enrich-transactions+api.ts`

Current pattern:
```typescript
export async function POST(request: Request): Promise<Response> {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "Failed to enrich transactions" }, { status: 500 });
  }
  try {
    const validation = await validateRequest(request, schema);
    if (!validation.success) return validation.response;
    // ... business logic
  } catch (error) {
    return Response.json({ error: "Failed to enrich transactions" }, { status: 500 });
  }
}
```

**Issues:**
- Error types are not tracked - callers don't know what can fail
- Generic catch loses error context
- Manual Result-like pattern (`validation.success`) without type safety
- Retry logic is ad-hoc and not composable

**With Effect:**
```typescript
class MissingApiKeyError extends Data.TaggedError("MissingApiKeyError") {}
class ValidationError extends Data.TaggedError("ValidationError")<{ details: string }> {}
class AIEnrichmentError extends Data.TaggedError("AIEnrichmentError")<{ cause: unknown }> {}

const enrichTransactions = (request: Request) =>
  Effect.gen(function* () {
    const apiKey = yield* getEnvOrFail("OPENROUTER_API_KEY").pipe(
      Effect.mapError(() => new MissingApiKeyError())
    );
    const data = yield* validateRequest(request, schema);
    const results = yield* processBatches(data).pipe(
      Effect.retry({ times: 1 })  // Built-in retry
    );
    return results;
  });

// Type: Effect<EnrichedTransaction[], MissingApiKeyError | ValidationError | AIEnrichmentError, never>
```

### 2. Validation Layer (Medium Improvement Potential)

**File:** `lib/api/api-validation.ts`

Current pattern uses a custom discriminated union that's already Effect-like:
```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };
```

**Benefit of Effect:** Could use `Effect.either` to convert to `Either<A, E>` for cleaner pattern matching, and integrate with schema validation via `@effect/schema` (alternative to Zod with Effect integration).

### 3. Database Operations (High Improvement Potential)

**File:** `db/client.ts`
```typescript
// TODO: #2 handle database loading error
const expoDb = openDatabaseSync("zkb-budget.db", { enableChangeListener: true });
```

**Issues:**
- No error handling for database initialization
- App crashes if database fails to open
- No recovery mechanism

**With Effect:**
```typescript
class DatabaseInitError extends Data.TaggedError("DatabaseInitError")<{ cause: unknown }> {}

const initDatabase = Effect.try({
  try: () => openDatabaseSync("zkb-budget.db", { enableChangeListener: true }),
  catch: (error) => new DatabaseInitError({ cause: error })
});

// Caller must handle DatabaseInitError - it's in the type!
```

### 4. XML Parsing (Medium Improvement Potential)

**File:** `lib/xml-parser.ts`

Current pattern silently filters invalid transactions:
```typescript
export const parseTransaction = (transaction: any): ParsedTransaction | null => {
  // Returns null for invalid data - no error information
};
```

**Issues:**
- `any` type loses all safety
- No way to know why a transaction was invalid
- Silent failures make debugging difficult

**With Effect:**
```typescript
class InvalidTransactionError extends Data.TaggedError("InvalidTransactionError")<{
  reason: "missing_statement" | "invalid_subtype" | "invalid_type";
  transaction: unknown;
}> {}

const parseTransaction = (transaction: unknown) =>
  Effect.gen(function* () {
    const statement = yield* Effect.fromNullable(transaction?.statement).pipe(
      Effect.mapError(() => new InvalidTransactionError({ reason: "missing_statement", transaction }))
    );
    // ... validation with typed errors
  });
```

### 5. Import Flow (High Improvement Potential)

**File:** `app/transactions/import-transactions.tsx`

Current pattern has deeply nested try-catch with mixed concerns:
```typescript
const handleImport = async () => {
  try {
    // File picking
    // XML parsing
    // Database insert
    try {
      // AI enrichment (non-critical)
    } catch (error) {
      // Silent failure
    }
  } catch (error) {
    Alert.alert("Import Failed", "An error occurred...");
  }
};
```

**Issues:**
- Monolithic function with mixed error handling strategies
- Can't easily distinguish critical vs non-critical failures
- No way to recover partially

**With Effect:**
```typescript
const importFlow = pipe(
  pickDocument,
  Effect.flatMap(parseXml),
  Effect.flatMap(insertTransactions),
  Effect.flatMap((txs) =>
    enrichTransactions(txs).pipe(
      Effect.catchAll(() => Effect.succeed(txs))  // Non-critical, fallback to unenriched
    )
  )
);
```

## Recommended Adoption Strategy

### Phase 1: Core Infrastructure (High Value, Low Risk)
1. **Database client** - Wrap initialization with Effect for proper error handling
2. **API validation** - Replace custom `ValidationResult` with Effect

### Phase 2: API Layer (High Value, Medium Effort)
1. **API routes** - Convert to Effect-based handlers
2. **Retry logic** - Use Effect's built-in `Effect.retry` with schedules

### Phase 3: Business Logic (Medium Value, Higher Effort)
1. **XML parsing** - Add typed parse errors
2. **Import flow** - Compose operations with Effect pipeline

### Phase 4: UI Layer (Lower Priority)
1. **Component error boundaries** - Use Effect for async operations
2. **Error display** - Pattern match on error types for specific messages

## Trade-offs to Consider

### Pros
- **Type-safe errors** - Errors tracked in the type system
- **Composability** - Rich combinators for error handling
- **Built-in retry/timeout** - No ad-hoc implementations
- **Better debugging** - Errors carry context through the stack

### Cons
- **Learning curve** - Effect has a steep learning curve
- **Bundle size** - Effect adds ~50KB (gzipped) to the bundle
- **Ecosystem integration** - May require wrappers for libraries like Drizzle
- **Team adoption** - Requires team buy-in for functional patterns

## Conclusion

The areas with highest ROI for Effect adoption are:

| Area | Current State | Effect Benefit | Priority |
|------|---------------|----------------|----------|
| Database init | Unhandled crash | Type-safe initialization | High |
| API routes | Manual try-catch | Typed errors + retry | High |
| Import flow | Nested try-catch | Composable pipeline | Medium |
| XML parsing | Silent null returns | Typed parse errors | Medium |
| Validation | Custom Result type | Effect integration | Low |

Starting with the database client and API routes would provide the most immediate value while establishing patterns for the rest of the codebase.

## Resources

- [Effect Documentation](https://effect.website/docs)
- [Expected Errors in Effect](https://effect.website/docs/error-management/expected-errors/)
- [Tweag: Exploring Effect in TypeScript](https://www.tweag.io/blog/2024-11-07-typescript-effect/)
