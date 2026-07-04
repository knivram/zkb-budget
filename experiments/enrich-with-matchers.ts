import { readFileSync, writeFileSync } from 'fs';
import { CATEGORIES, type Category, type Transaction } from '@/db/schema';
import { parseXMLTransactions } from '@/lib/xml-parser';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// --- Matcher schema ---

const matcherSchema = z.object({
  pattern: z
    .string()
    .describe('JavaScript regex pattern to test against transactionAdditionalDetails'),
  displayName: z
    .string()
    .describe('Clean display name. Use $1, $2 etc. to reference capture groups from the pattern.'),
  category: z.enum(CATEGORIES),
  domain: z.string().optional().describe('Merchant domain if known (e.g., "coop.ch")'),
  priority: z
    .number()
    .int()
    .describe('Lower = matched first. Specific patterns: 1-10, variants: 11-30, broad: 31-50.'),
});

const matcherSetSchema = z.object({
  matchers: z.array(matcherSchema),
});

type Matcher = z.infer<typeof matcherSchema>;

// --- AI prompt ---

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  income: 'Salary, wages, freelance income, bonuses, tax returns, gifts received, refunds',
  transfer: 'Transfers between own accounts, moving money to savings',
  housing: 'Rent, mortgage payments, property tax, home insurance, HOA fees, home repairs',
  food: 'Supermarkets, grocery stores, food shopping (Migros, Coop, Lidl, Aldi)',
  utilities: 'Electricity, water, gas, heating, internet, mobile phone, landline',
  transport:
    'Fuel, gas stations, public transport, car payments, car insurance, parking, tolls, repairs',
  healthcare: 'Doctor visits, pharmacy, health insurance, medications, dental, optical care',
  dining: "Restaurants, cafes, bars, food delivery, takeout (McDonald's, Uber Eats, Starbucks)",
  shopping: 'Clothing, electronics, home goods, furniture, books (Amazon, H&M, IKEA, Target)',
  entertainment:
    'Streaming services, movies, concerts, games, hobbies, sports events (Netflix, Spotify, Cinema)',
  personal_care: 'Gym memberships, haircuts, beauty salons, cosmetics, spa, sports equipment',
  other: "Transactions that don't clearly fit any category or need manual review",
};

const systemPrompt = `You are a regex pattern engineer for Swiss bank transaction categorization.

You will receive a list of unique transaction description strings from a ZKB (Zürcher Kantonalbank) export.
Your task is to produce an array of regex matchers that can categorize ALL these transactions deterministically.

## Transaction Description Formats
The descriptions follow these formats:
- "Credit salary: COMPANY, ADDRESS" — income
- "Credit/Debit TWINT: MERCHANT_OR_PERSON CITY" — various categories
- "Credit/Debit TWINT: LASTNAME, FIRSTNAME +phone" — person-to-person transfers
- "Debit Standing order: NAME, ADDRESS" — transfers or recurring bills
- "Debit/Credit Account transfer: NAME, ADDRESS" — transfers
- "Debit Mobile Banking: COMPANY, ADDRESS" — various
- "Online purchase ZKB Visa Debit card no. xxxx NNNN, MERCHANT" — online purchases/subscriptions
- "Purchase ZKB Visa Debit card no. xxxx NNNN, MERCHANT CITY" — in-store purchases

## Categories
${Object.entries(CATEGORY_DESCRIPTIONS)
  .map(([cat, desc]) => `- ${cat}: ${desc}`)
  .join('\n')}

## Output Rules
For each matcher provide:
- pattern: JavaScript-compatible regex string (no delimiters, no flags). Will be compiled with the "i" flag.
- displayName: Clean merchant/payee name. Use $1, $2 for capture group references. Apply title case.
- category: One of the 12 categories listed above.
- domain: Merchant website domain if confidently known (e.g., "netflix.com"). Omit if unknown.
- priority: Integer. Lower = matched first. Use 1-10 for exact merchants, 11-30 for pattern variants, 31-50 for broad structural patterns.

## Important Rules
1. Every input description must be matched by at least one pattern.
2. Prefer specific patterns over broad ones.
3. For merchants with location/number variants (e.g., Coop-1412, Coop-3311), write ONE pattern with \\d+.
4. TWINT with a phone number (+41...) is person-to-person → category "transfer".
5. TWINT without phone number is a merchant payment → categorize by merchant type.
6. Standing orders and account transfers default to "transfer".
7. Salary credits are always "income".
8. Patterns are tested with JavaScript RegExp — use JS-compatible syntax.
9. Always include catch-all fallback patterns at high priority numbers to ensure 100% coverage.`;

function buildUserPrompt(uniqueDetails: string[]): string {
  const list = uniqueDetails.map((d, i) => `${i + 1}. ${d}`).join('\n');
  return `Generate regex matchers for these ${uniqueDetails.length} unique transaction descriptions:\n\n${list}`;
}

// --- Matcher application ---

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function applyMatchers(
  details: string,
  matchers: Matcher[]
): { displayName: string; category: Category; domain?: string } | null {
  for (const matcher of matchers) {
    const regex = new RegExp(matcher.pattern, 'i');
    const match = details.match(regex);
    if (match) {
      let displayName = matcher.displayName;
      for (let i = 1; i < match.length; i++) {
        displayName = displayName.replace(`$${i}`, match[i] ?? '');
      }
      displayName = toTitleCase(displayName.replace(/\s+/g, ' ').trim());
      return {
        displayName,
        category: matcher.category,
        domain: matcher.domain,
      };
    }
  }
  return null;
}

// --- Main ---

async function generateMatchers(
  uniqueDetails: string[],
  openrouter: ReturnType<typeof createOpenRouter>
): Promise<Matcher[]> {
  console.log(`Sending ${uniqueDetails.length} unique descriptions to AI...`);

  const result = await generateText({
    model: openrouter.chat('google/gemini-3-flash-preview'),
    output: Output.object({ schema: matcherSetSchema }),
    system: systemPrompt,
    prompt: buildUserPrompt(uniqueDetails),
  });

  const matchers = result.output.matchers;

  // Validate that all patterns compile
  const validMatchers: Matcher[] = [];
  for (const matcher of matchers) {
    try {
      new RegExp(matcher.pattern, 'i');
      validMatchers.push(matcher);
    } catch {
      console.warn(`Invalid regex discarded: ${matcher.pattern}`);
    }
  }

  // Sort by priority
  validMatchers.sort((a, b) => a.priority - b.priority);

  console.log(
    `Generated ${validMatchers.length} valid matchers (${matchers.length - validMatchers.length} discarded)`
  );
  return validMatchers;
}

function parseArgs(): { xmlPath: string; matchersPath?: string } {
  const args = process.argv.slice(2);
  let xmlPath: string | undefined;
  let matchersPath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--matchers=')) {
      matchersPath = arg.slice('--matchers='.length);
    } else if (!arg.startsWith('--')) {
      xmlPath = arg;
    }
  }

  if (!xmlPath) {
    console.error(
      'Usage: bun run experiments/enrich-with-matchers.ts <xml-path> [--matchers=<json>]'
    );
    process.exit(1);
  }

  return { xmlPath, matchersPath };
}

async function main() {
  const { xmlPath, matchersPath } = parseArgs();

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

  let matchers: Matcher[];

  if (matchersPath) {
    // Load cached matchers
    console.log(`Loading matchers from: ${matchersPath}`);
    const raw = JSON.parse(readFileSync(matchersPath, 'utf-8'));
    matchers = z.array(matcherSchema).parse(raw);
    matchers.sort((a, b) => a.priority - b.priority);
    console.log(`Loaded ${matchers.length} matchers`);
  } else {
    // Generate matchers via AI
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY environment variable is not set');
      process.exit(1);
    }
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

    const uniqueDetails = [...new Set(transactions.map((t) => t.transactionAdditionalDetails))];
    console.log(`Found ${uniqueDetails.length} unique transaction descriptions`);

    matchers = await generateMatchers(uniqueDetails, openrouter);

    // Save matchers for reuse
    const savePath = 'experiments/generated-matchers.json';
    writeFileSync(savePath, JSON.stringify(matchers, null, 2));
    console.log(`Matchers saved to: ${savePath}`);
  }

  // Apply matchers to all transactions
  const enriched: Array<{
    id: string;
    details: string;
    displayName: string;
    category: Category;
    domain?: string;
  }> = [];
  const unmatched: string[] = [];

  for (const tx of transactions) {
    const result = applyMatchers(tx.transactionAdditionalDetails, matchers);
    if (result) {
      enriched.push({
        id: tx.id,
        details: tx.transactionAdditionalDetails,
        ...result,
      });
    } else {
      unmatched.push(tx.transactionAdditionalDetails);
      enriched.push({
        id: tx.id,
        details: tx.transactionAdditionalDetails,
        displayName: tx.transactionAdditionalDetails,
        category: 'other',
      });
    }
  }

  // Stats
  const matchedCount = transactions.length - unmatched.length;
  console.log(`\n--- Results ---`);
  console.log(
    `Matched: ${matchedCount}/${transactions.length} (${Math.round((matchedCount / transactions.length) * 100)}%)`
  );

  // Category distribution
  const categoryCount: Record<string, number> = {};
  for (const e of enriched) {
    categoryCount[e.category] = (categoryCount[e.category] ?? 0) + 1;
  }
  console.log(`\nCategory distribution:`);
  for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  if (unmatched.length > 0) {
    console.log(`\nUnmatched transactions (${unmatched.length}):`);
    for (const detail of [...new Set(unmatched)]) {
      console.log(`  - ${detail}`);
    }
  }

  console.log(`\nEnriched transactions:`);
  console.log(JSON.stringify(enriched, null, 2));
}

main();
