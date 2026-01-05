# ZKB Budget

A React Native/Expo app for tracking personal finances using transaction data exported from ZKB (Zürcher Kantonalbank). Features AI-powered transaction categorization and automatic subscription detection.

## Features

- **Transaction Import**: Import XML transaction exports from ZKB
- **AI-Powered Categorization**: Automatically categorizes transactions and extracts merchant names using Google Gemini
- **Subscription Detection**: AI analyzes transaction patterns to identify recurring subscriptions
- **Subscription Management**: Track and manage your subscriptions with domain-based logos
- **Native UI**: Built with Expo and @expo/ui SwiftUI components for a native iOS experience

## Tech Stack

- [Expo](https://expo.dev) SDK 54 with [Expo Router](https://docs.expo.dev/router/introduction/) 6
- React Native 0.81
- TypeScript
- [Drizzle ORM](https://orm.drizzle.team/) with Expo SQLite
- [NativeWind](https://www.nativewind.dev/) (TailwindCSS for React Native)
- [OpenRouter](https://openrouter.ai/) AI SDK
- [TOON format](https://github.com/toon-format/toon) for token-efficient AI prompts

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional)
- iOS Simulator or physical device

### Installation

1. Install dependencies:

   ```bash
   bun install
   ```

2. Set up environment variables:

   ```txt
   # Create a .env file with your OpenRouter API key
   OPENROUTER_API_KEY=your_api_key_here
   EXPO_PUBLIC_LOGO_DEV_KEY=your_logo_dev_key_here
   ```

3. Create a prebuild:

   ```bash
   bunx expo prebuild
   ```

4. Run on your preferred platform:

   ```bash
   bun run ios
   ```

## Database

The app uses Expo SQLite with Drizzle ORM for local data storage.

### Schema

- **transactions**: Bank transactions with category, display name, domain, and subscription linking
- **subscriptions**: Tracked subscriptions with name, price, billing cycle, and domain

### Migrations

After modifying `db/schema.ts`, generate new migrations:

```bash
bun run db:generate
```

## Usage

1. **Import Transactions**: Export your transactions as XML from ZKB eBanking and import them into the app
2. **Review Categories**: The AI automatically categorizes your transactions - review and adjust as needed
3. **Detect Subscriptions**: Use the subscription detection feature to find recurring payments
4. **Track Subscriptions**: Manage your subscriptions and see which transactions are linked to them

## Development

```bash
# Start dev server
bun start

# Run linter
bun run lint

# Generate DB migrations
bun run db:generate
```
