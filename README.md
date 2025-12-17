# tabletalk - Plans-First Social Dining App

**tabletalk turns restaurants into conversations—and conversations into plans.**

tabletalk is a plans-first, social dining app where restaurants are conversation starters and plans are the core unit of value. It's not a restaurant rating or food logging app. The core value is: Turn "want to try" into "let's go."

**Flow**: Restaurants → Tables → People → Plans

## Features

- **Swipe & Discover**: Swipe through restaurant recommendations powered by Yelp Fusion API
- **AI-Powered Insights**: Get personalized "Why This Table" explanations using Yelp AI and Groq
- **Table Chat**: Create and manage dining plans with friends
- **Restaurant Assistant**: Chat with an AI assistant that knows each restaurant intimately
- **Plan Builder**: Generate engaging invite messages and plan details with AI
- **Smart Caching**: AI responses are cached for 24 hours for better performance
- **Location-Based**: Find restaurants near you using device location

## Tech Stack

- **Framework**: React Native with Expo (~54.0.29)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **APIs**: 
  - Yelp Fusion API (restaurant search & details)
  - Yelp AI API (restaurant insights & Q&A)
  - Groq API (LLM-powered conversations)
- **Storage**: AsyncStorage for local data persistence
- **Location**: Expo Location for geolocation services

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended, v20+ ideal)
- npm or yarn package manager
- Expo Go app installed on your phone (iOS or Android)
- API keys:
  - [Yelp API key](https://www.yelp.com/developers) (Fusion API)
  - [Groq API key](https://console.groq.com/) (for AI features)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   YELP_API_KEY=your_yelp_api_key_here
   YELP_CLIENT_ID=your_yelp_client_id_here
   GROQ_API_KEY=your_groq_api_key_here
   ```
   
   **Note**: The `.env` file is gitignored and won't be committed to the repository.

4. **Start the development server**
   ```bash
   npm start
   ```
   
   This will:
   - Start the Metro bundler
   - Display a QR code in your terminal
   - Open Expo DevTools in your browser

5. **Run on your device**
   - Open Expo Go app on your phone
   - Scan the QR code from the terminal
   - The app will load on your device with live reload

```

## Project Structure

```
tabletalk/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ActionBar.tsx
│   │   ├── Chip.tsx
│   │   ├── MetaRow.tsx
│   │   ├── RestaurantCard.tsx
│   │   ├── RestaurantCardCompact.tsx
│   │   ├── SparklesIcon.tsx
│   │   └── NavBar.tsx
│   ├── screens/             # Screen components
│   │   ├── OnboardingScreen.tsx
│   │   ├── PlanBuilderScreen.tsx
│   │   ├── RestaurantAssistantScreen.tsx
│   │   ├── SavedTablesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── SwipeScreen.tsx
│   │   ├── TableChatScreen.tsx
│   │   └── TablesScreen.tsx
│   ├── services/            # API services
│   │   ├── groqApi.ts       # Groq API client
│   │   ├── types.ts         # API type definitions
│   │   └── yelpApi.ts       # Yelp API client
│   ├── context/             # React Context providers
│   │   └── SwipeContext.tsx
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   │   ├── aiCache.ts       # AI response caching
│   │   ├── aiTemplates.ts   # AI prompt templates
│   │   ├── distance.ts      # Distance calculations
│   │   ├── mockData.ts      # Mock data for development
│   │   └── storage.ts       # AsyncStorage utilities
│   ├── design/              # Design tokens
│   │   └── tokens.ts        # Colors, spacing, typography
│   └── types/               # TypeScript type definitions
│       └── env.d.ts         # Environment variable types
├── assets/                  # Images and static assets
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Code Standards

- **TypeScript**: Strict mode enabled for type safety
- **Components**: Functional components with React hooks
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **API Calls**: Type-safe API calls with error handling
- **Code Organization**: Modular structure with separation of concerns
- **Performance**: AI response caching to reduce API calls

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env` file exists in the root directory
- Restart the Expo server after creating/updating `.env`
- Check that variable names match exactly (no spaces around `=`)

### API Errors
- **401 Unauthorized**: Verify your API keys are correct and active
- **Rate Limits**: Yelp and Groq APIs have rate limits; cached responses help mitigate this
- **Network Errors**: Check your internet connection and API service status

### Metro Bundler Issues
- Clear cache: `npx expo start -c`
- Reset: `rm -rf node_modules && npm install`

## License

See [LICENSE](./LICENSE) file for details.
