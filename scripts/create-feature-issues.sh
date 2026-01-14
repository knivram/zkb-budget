#!/bin/bash
# Run this script after authenticating with: gh auth login
# Usage: ./scripts/create-feature-issues.sh

set -e

REPO="knivram/zkb-budget"

echo "Creating labels..."
gh label create "priority:critical" --color "B60205" --description "Priority 10 - Must have" --repo "$REPO" 2>/dev/null || true
gh label create "priority:high" --color "D93F0B" --description "Priority 8-9 - Important" --repo "$REPO" 2>/dev/null || true
gh label create "priority:medium" --color "FBCA04" --description "Priority 6-7 - Nice to have" --repo "$REPO" 2>/dev/null || true
gh label create "priority:low" --color "0E8A16" --description "Priority 5 - Future" --repo "$REPO" 2>/dev/null || true
gh label create "feature" --color "1D76DB" --description "New feature request" --repo "$REPO" 2>/dev/null || true

echo "Creating feature issues..."

# Priority 10 (Critical) - Core budgeting functionality
gh issue create --repo "$REPO" \
  --title "[P10] Budget Setting & Tracking" \
  --label "feature,priority:critical" \
  --body "**Priority: 10/10 (Critical)**

Set monthly budgets per category and track progress against them. Show remaining budget, percentage used, and visual progress indicators.

This is THE core value proposition of a budget app."

gh issue create --repo "$REPO" \
  --title "[P10] Budget Alerts & Warnings" \
  --label "feature,priority:critical" \
  --body "**Priority: 10/10 (Critical)**

Notify users when approaching or exceeding budget limits. Show warnings at 80%, 90%, and 100% thresholds."

# Priority 9 (High) - Essential usability
gh issue create --repo "$REPO" \
  --title "[P9] Transaction Search" \
  --label "feature,priority:high" \
  --body "**Priority: 9/10 (High)**

Search transactions by merchant name, amount, or description. Essential for finding specific transactions in a large history."

gh issue create --repo "$REPO" \
  --title "[P9] Advanced Transaction Filters" \
  --label "feature,priority:high" \
  --body "**Priority: 9/10 (High)**

Filter transactions by category, amount range, date range, and subscription status. Combine multiple filters."

gh issue create --repo "$REPO" \
  --title "[P9] Manual Category Override" \
  --label "feature,priority:high" \
  --body "**Priority: 9/10 (High)**

Allow users to manually change a transaction's category after AI enrichment. AI isn't perfect - users need control."

# Priority 8 (High) - Important improvements
gh issue create --repo "$REPO" \
  --title "[P8] Custom Date Range Analytics" \
  --label "feature,priority:high" \
  --body "**Priority: 8/10 (High)**

View analytics for any date range, not just fixed months. Support week, quarter, year, and custom ranges."

gh issue create --repo "$REPO" \
  --title "[P8] Export to CSV" \
  --label "feature,priority:high" \
  --body "**Priority: 8/10 (High)**

Export transaction history and analytics to CSV/Excel format. Users want their data - builds trust."

gh issue create --repo "$REPO" \
  --title "[P8] Manual Subscription Linking" \
  --label "feature,priority:high" \
  --body "**Priority: 8/10 (High)**

Manually link or unlink transactions to subscriptions. Fix cases where AI detection missed or incorrectly linked."

# Priority 7 (Medium-High) - Valuable additions
gh issue create --repo "$REPO" \
  --title "[P7] Spending Goals" \
  --label "feature,priority:medium" \
  --body "**Priority: 7/10 (Medium-High)**

Set specific spending goals like 'Spend less than 500 CHF on dining this month'. Track progress toward goals."

gh issue create --repo "$REPO" \
  --title "[P7] Year-over-Year Comparison" \
  --label "feature,priority:medium" \
  --body "**Priority: 7/10 (Medium-High)**

Compare spending to the same period last year. Shows long-term spending trends and seasonal patterns."

gh issue create --repo "$REPO" \
  --title "[P7] Trend Analysis" \
  --label "feature,priority:medium" \
  --body "**Priority: 7/10 (Medium-High)**

AI-powered insights like 'Your dining spending is up 20% this quarter' or 'You've reduced transport costs by 15%'."

gh issue create --repo "$REPO" \
  --title "[P7] Split Transactions" \
  --label "feature,priority:medium" \
  --body "**Priority: 7/10 (Medium-High)**

Split a single transaction across multiple categories. Useful for grocery trips that include non-food items."

# Priority 6 (Medium) - Nice to have
gh issue create --repo "$REPO" \
  --title "[P6] Custom Categories/Tags" \
  --label "feature,priority:medium" \
  --body "**Priority: 6/10 (Medium)**

Allow users to create custom categories or add tags to transactions for personalized tracking beyond the 12 preset categories."

gh issue create --repo "$REPO" \
  --title "[P6] Bill Reminders" \
  --label "feature,priority:medium" \
  --body "**Priority: 6/10 (Medium)**

Track upcoming bills and recurring payments. Show calendar of expected charges for the month."

gh issue create --repo "$REPO" \
  --title "[P6] Subscription Renewal Reminders" \
  --label "feature,priority:medium" \
  --body "**Priority: 6/10 (Medium)**

Notify users before subscription renewals, especially for yearly subscriptions. Help avoid unwanted charges."

gh issue create --repo "$REPO" \
  --title "[P6] Backup & Restore" \
  --label "feature,priority:medium" \
  --body "**Priority: 6/10 (Medium)**

Export and import full app data for backup purposes. Allow data migration between devices."

gh issue create --repo "$REPO" \
  --title "[P6] Forecasting" \
  --label "feature,priority:medium" \
  --body "**Priority: 6/10 (Medium)**

Predict month-end balance based on spending patterns and known upcoming subscriptions/bills."

# Priority 5 (Medium-Low) - Future enhancements
gh issue create --repo "$REPO" \
  --title "[P5] Multi-Account Support" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Track transactions across multiple bank accounts. Show consolidated view and per-account breakdowns."

gh issue create --repo "$REPO" \
  --title "[P5] Account Transfer Handling" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Properly identify and handle transfers between own accounts. Don't count transfers as expenses/income."

gh issue create --repo "$REPO" \
  --title "[P5] Duplicate Detection" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Flag potential duplicate imports and let users merge or delete duplicates."

gh issue create --repo "$REPO" \
  --title "[P5] Weekly/Monthly Summary Notifications" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Push notification with spending summary at end of week/month. Keep users engaged with their budget."

gh issue create --repo "$REPO" \
  --title "[P5] Unusual Spending Alerts" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Alert users when a transaction is unusually large compared to their normal spending patterns."

gh issue create --repo "$REPO" \
  --title "[P5] Irregular Recurring Expenses" \
  --label "feature,priority:low" \
  --body "**Priority: 5/10 (Medium-Low)**

Track quarterly, semi-annual, and annual recurring expenses beyond regular subscriptions (insurance, taxes, etc)."

echo ""
echo "✓ Created 23 feature issues!"
echo "View them at: https://github.com/$REPO/issues"
