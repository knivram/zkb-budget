import { readFileSync } from 'fs';
import type { Transaction } from '@/db/schema';
import { EnrichedTransaction, transactionEnrichmentResponseSchema } from '@/lib/api/ai-schemas';
import { TRANSACTION_ENRICHMENT } from '@/lib/api/promts';
import { parseXMLTransactions } from '@/lib/xml-parser';
import { convertSubscriptionsToToon, convertTransactionsToToon } from '@/lib/toon-converter';
import { chunkArray } from '@/lib/utils';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';

const BATCH_SIZE = 50;

async function processBatch(
  transactions: Transaction[],
  openrouter: ReturnType<typeof createOpenRouter>
): Promise<EnrichedTransaction[]> {
  const toonTransactions = convertTransactionsToToon(transactions);
  const toonSubscriptions = convertSubscriptionsToToon([]);

  const result = await generateText({
    model: openrouter.chat('google/gemini-3-flash-preview'),
    output: Output.object({
      schema: transactionEnrichmentResponseSchema,
    }),
    system: TRANSACTION_ENRICHMENT.system,
    prompt: TRANSACTION_ENRICHMENT.user(toonTransactions, toonSubscriptions),
  });

  return result.output.transactions;
}

async function processWithRetry(
  transactions: Transaction[],
  openrouter: ReturnType<typeof createOpenRouter>
): Promise<EnrichedTransaction[]> {
  try {
    return await processBatch(transactions, openrouter);
  } catch (error) {
    console.warn(`Batch of ${transactions.length} failed, retrying...`, error);
    return await processBatch(transactions, openrouter);
  }
}

async function main() {
  const xmlPath = process.argv[2];
  if (!xmlPath) {
    console.error('Usage: bun run experiments/enrich-transactions.ts <path-to-xml>');
    process.exit(1);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY environment variable is not set');
    process.exit(1);
  }

  const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

  console.log(`Reading XML from: ${xmlPath}`);
  const xmlContent = readFileSync(xmlPath, 'utf-8');

  const transactions: Transaction[] = parseXMLTransactions(xmlContent).map((t) => ({
    ...t,
    createdAt: t.createdAt ?? new Date(),
    category: t.category ?? 'other',
    displayName: t.displayName ?? null,
    domain: t.domain ?? null,
    subscriptionId: t.subscriptionId ?? null,
  }));
  console.log(`Parsed ${transactions.length} transactions`);

  const batches = chunkArray(transactions, BATCH_SIZE);
  console.log(`Processing ${batches.length} batch(es)...`);

  const results = await Promise.allSettled(
    batches.map((batch) => processWithRetry(batch, openrouter))
  );

  const enrichedTransactions = results
    .filter((r): r is PromiseFulfilledResult<EnrichedTransaction[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const failedCount = results.filter((r) => r.status === 'rejected').length;
  if (failedCount > 0) {
    console.warn(`${failedCount}/${batches.length} batches failed after retry`);
  }

  console.log(`\nEnriched ${enrichedTransactions.length}/${transactions.length} transactions:\n`);
  console.log(JSON.stringify(enrichedTransactions, null, 2));
}

main();
