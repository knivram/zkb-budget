# Plan: Combined AI Enrichment with Background Processing

## Problem Statement

### Current State
1. **Transaction Enrichment** (`/api/enrich-transactions`): Enriches transactions with category, displayName, domain, and links to **existing** subscriptions
2. **Subscription Detection** (`/api/detect-subscriptions`): Detects new subscriptions from transaction patterns (currently disabled)

### The Problem
- Enrichment can only link transactions to **already existing** subscriptions
- When importing, subscriptions mostly don't exist yet
- Two separate AI calls are wasteful and slow
- Current UX blocks the import sheet while AI processes (bad for many transactions)

---

## Part 1: Combining Subscription Detection + Transaction Enrichment

### Approach A: Sequential Two-Phase AI Call (Single Request)

**How it works:**
1. Send all transactions + existing subscriptions to AI
2. AI first detects new subscriptions from patterns
3. AI then enriches all transactions, linking to both existing AND newly detected subscriptions
4. Response includes: `{ detectedSubscriptions: [...], transactions: [...] }`

**Pros:**
- Single API call reduces latency
- AI has full context for both tasks
- Detected subscriptions get temporary IDs that transactions can reference

**Cons:**
- Larger prompt = more tokens = higher cost
- If detection fails, enrichment might also fail
- Complex schema merging

**Implementation:**
```typescript
// Combined response schema
{
  detectedSubscriptions: [
    { tempId: "temp_1", name: "Netflix", price: 15.95, ... }
  ],
  transactions: [
    { id: "tx_123", subscriptionTempId: "temp_1", ... }  // References detected sub
    { id: "tx_456", subscriptionId: 5, ... }              // References existing sub
  ]
}
```

---

### Approach B: Two Separate AI Calls (Current Architecture, Reordered)

**How it works:**
1. First call: Detect subscriptions from all transactions
2. Insert detected subscriptions into DB (get real IDs)
3. Second call: Enrich transactions with existing + newly inserted subscriptions

**Pros:**
- Simpler, uses existing code
- Each call has focused responsibility
- If detection fails, can still enrich without subscription linking

**Cons:**
- Two API calls = more latency
- More total tokens (transactions sent twice)
- Sequential dependency slows overall time

---

### Approach C: Unified Enrichment with Inline Subscription Suggestions

**How it works:**
1. Single AI call that enriches each transaction
2. For each transaction, AI can suggest a NEW subscription if it detects one
3. Response per transaction includes optional `suggestedSubscription` object

**Pros:**
- Most natural mental model: "for each transaction, what do we know?"
- Subscriptions emerge from individual transactions
- Easier streaming (one transaction at a time)

**Cons:**
- Duplicates: Same subscription might be suggested multiple times
- Need deduplication logic
- AI might not see the full pattern (only individual transactions)

**Implementation:**
```typescript
// Per-transaction response
{
  id: "tx_123",
  category: "entertainment",
  displayName: "Netflix",
  domain: "netflix.com",
  subscriptionId: null,  // No existing match
  suggestedSubscription: {
    name: "Netflix",
    price: 15.95,
    billingCycle: "monthly",
    confidence: 0.9
  }
}
```

---

### Approach D: Hybrid - Detection First Pass, Then Unified Enrichment (Recommended)

**How it works:**
1. Single AI call with two distinct phases in the prompt
2. **Phase 1**: AI analyzes all transactions and outputs detected subscriptions with temporary IDs
3. **Phase 2**: AI enriches all transactions, linking to:
   - Existing subscriptions (by real ID)
   - Detected subscriptions (by temp ID)
4. Client-side: Insert detected subs, map temp IDs to real IDs, update transactions

**Why this is best:**
- Single API call (efficient)
- AI sees full pattern for subscription detection (unlike Approach C)
- Clear separation of concerns in output (unlike messy inline suggestions)
- Transactions can reference both existing and new subscriptions
- Works well with streaming (detected subs come first, then transactions)

**Schema:**
```typescript
const combinedResponseSchema = z.object({
  detectedSubscriptions: z.array(z.object({
    tempId: z.string(),          // e.g., "detected_1"
    name: z.string(),
    price: z.number(),           // in CHF
    billingCycle: z.enum(["weekly", "monthly", "yearly"]),
    domain: z.string().optional(),
    subscribedAt: z.string(),    // ISO date
    confidence: z.number(),
    reasoning: z.string().optional(),
  })),
  transactions: z.array(z.object({
    id: z.string(),
    category: z.enum([...]),
    displayName: z.string(),
    domain: z.string().optional(),
    existingSubscriptionId: z.number().optional(),  // Matches existing
    detectedSubscriptionTempId: z.string().optional(),  // Matches detected
  })),
});
```

**Recommendation: Approach D** - Best balance of efficiency, accuracy, and implementation complexity.

---

## Part 2: Background Processing with Streaming

### Current Problem
- AI enrichment blocks the import sheet
- Users see "Enriching transactions..." for potentially minutes
- No progress indication
- Can't dismiss or use app while processing

### Approach A: Simple Background Task (Expo Background Fetch)

**How it works:**
1. Import transactions to DB immediately
2. Mark them as "pending_enrichment"
3. Close the sheet, show success
4. Background task picks up and processes
5. Drizzle live queries update UI when done

**Pros:**
- Simple architecture
- Works even if app is minimized
- Uses existing live query infrastructure

**Cons:**
- No real-time progress indication
- User doesn't know when it's done
- iOS background fetch is limited and unreliable

---

### Approach B: Foreground Task with UI Polling

**How it works:**
1. Start enrichment, return immediately with a `jobId`
2. Store job status in DB or memory
3. UI polls `/api/job-status/:jobId` every second
4. Update UI based on job progress

**Pros:**
- Works reliably in foreground
- Can show progress percentage

**Cons:**
- Polling is inefficient
- Complex job state management
- Still can't stream individual results

---

### Approach C: Server-Sent Events (SSE) Streaming (Recommended)

**How it works:**
1. Import transactions to DB immediately, close sheet
2. Start enrichment request that returns SSE stream
3. As AI returns results, stream them to client
4. Client updates individual transaction rows in real-time
5. Show global progress indicator in header/footer

**Pros:**
- Real-time updates (transactions appear enriched one-by-one)
- Excellent UX (users see progress live)
- Single HTTP connection (efficient)
- Works with Vercel AI SDK's streaming

**Cons:**
- SSE connection management complexity
- Need to handle disconnects/reconnects
- More complex error handling

**Implementation Plan:**
```typescript
// API endpoint returns SSE stream
export async function POST(request: Request) {
  // ... validation

  const stream = new ReadableStream({
    async start(controller) {
      // Stream detected subscriptions first
      controller.enqueue(`data: ${JSON.stringify({
        type: 'subscription',
        data: detectedSub
      })}\n\n`);

      // Stream each enriched transaction
      for await (const enriched of aiStream) {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'transaction',
          data: enriched
        })}\n\n`);
      }

      controller.enqueue('data: {"type": "done"}\n\n');
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

---

### Approach D: WebSocket Connection

**How it works:**
Similar to SSE but uses WebSocket for bidirectional communication.

**Pros:**
- Bidirectional (could cancel/pause)
- Works across all platforms

**Cons:**
- More complex than SSE
- Overkill for one-way streaming
- WebSocket server setup needed

---

**Recommendation: Approach C (SSE)** - Best fit for streaming AI responses with real-time UI updates.

### Progress Indicator Design

**Global Indicator Options:**

1. **Header Badge**: Small pill in nav bar showing "Processing 45/100"
2. **Toast/Snackbar**: Persistent bottom toast with progress bar
3. **Tab Badge**: Badge on transactions tab showing pending count
4. **Inline Row Skeleton**: Transaction rows show skeleton until enriched

**Recommended: Combination of:**
- **Toast with progress bar** at bottom (primary indicator)
- **Inline row indicator** showing spinner on unenriched rows
- When complete: Toast slides away, rows update via live queries

---

## Part 3: Saving Suggested Subscriptions

### The Flow

1. AI detects subscriptions during enrichment
2. Detected subscriptions need user review before becoming "real"
3. User should see an indicator that suggestions exist
4. Review screen lets user approve/reject each

### Database Schema Change

Add a `suggested_subscriptions` table for pending review:

```sql
CREATE TABLE suggested_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,  -- cents
  billing_cycle TEXT NOT NULL,
  subscribed_at INTEGER NOT NULL,
  domain TEXT,
  confidence REAL NOT NULL,
  reasoning TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  reviewed_at INTEGER
);
```

### Linking Transactions to Suggested Subscriptions

**Option A: Null subscriptionId until approved**
- Transactions have null subscriptionId
- After approval, update all matching transactions

**Option B: Separate suggestedSubscriptionId column**
- Transactions link to suggested subs
- On approval, copy to subscriptions, update references

**Recommendation: Option A** - Simpler, and we can re-link transactions after approval using displayName/domain matching.

### User Indicator Options

1. **Badge on Subscriptions Tab**:
   - Show red badge with count: "Subscriptions (3)"
   - Tapping shows list with "Suggestions" section at top

2. **Dedicated "Review Suggestions" Button**:
   - Prominent button in subscriptions list header
   - Only visible when suggestions exist

3. **Inline Cards in Subscription List**:
   - Suggested subscriptions appear in list with different styling
   - "Suggested" badge, yellow/orange border
   - Accept/Reject buttons inline

4. **Modal After Import**:
   - If suggestions detected, show modal/sheet immediately
   - "We found 3 subscriptions. Review now?"

**Recommendation: Combination of:**
- **Tab badge** for persistent awareness
- **Inline cards** in subscription list (non-intrusive review)
- Quick accept/reject with swipe or buttons

---

## Implementation Plan

### Phase 1: Combined AI Endpoint
1. Create new `/api/process-transactions` endpoint
2. Implement combined prompt (detection + enrichment)
3. Create combined response schema
4. Implement temp ID mapping logic
5. Update import flow to use new endpoint

### Phase 2: Database Changes
1. Add `suggested_subscriptions` table
2. Create migration
3. Add queries for CRUD operations

### Phase 3: SSE Streaming
1. Convert endpoint to SSE stream
2. Implement client-side EventSource handling
3. Create progress state management
4. Implement real-time transaction updates

### Phase 4: UI Indicators
1. Create enrichment progress toast component
2. Add inline loading states to transaction rows
3. Add tab badge for pending suggestions
4. Create inline suggestion cards in subscription list

### Phase 5: Review Flow
1. Implement approve/reject for inline cards
2. After approval: insert to subscriptions, re-link transactions
3. Cleanup rejected suggestions

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Call Strategy | **D: Hybrid Detection-Then-Enrich** | Single call, full pattern visibility, clean schema |
| Streaming | **SSE (Server-Sent Events)** | Real-time updates, works with AI SDK |
| Subscription Storage | **Separate suggested_subscriptions table** | Clean separation, preserves confidence/reasoning |
| Transaction Linking | **Null until approved, re-link after** | Simple, avoids FK complexity |
| Progress Indicator | **Bottom toast + inline spinners** | Non-intrusive, clear progress |
| Review UX | **Inline cards with tab badge** | Discoverable, non-disruptive |

---

## Files to Create/Modify

### New Files
- `app/api/process-transactions+api.ts` - Combined streaming endpoint
- `lib/api/process-schemas.ts` - Combined schemas
- `lib/api/process-prompts.ts` - Combined prompts
- `components/EnrichmentProgress.tsx` - Progress toast
- `hooks/useEnrichmentStream.ts` - SSE client hook

### Modified Files
- `db/schema.ts` - Add suggested_subscriptions table
- `app/transactions/import-transactions.tsx` - Use new flow
- `app/transactions/index.tsx` - Inline loading states
- `app/subscriptions/index.tsx` - Inline suggestion cards, tab badge
- `app/subscriptions/_layout.tsx` - Tab badge

### Migrations
- New migration for suggested_subscriptions table
