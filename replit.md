# OnSpace App (PlayArena)

## Overview
A React Native + Expo mobile app called **PlayArena** — a sports venue booking platform. Built with Expo Router for file-based routing and runs on iOS, Android, and Web.

## Tech Stack
- **Framework:** React Native + Expo (~53)
- **Routing:** Expo Router (file-based, similar to Next.js Pages Router)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Auth:** Custom mock auth service with AsyncStorage session persistence
- **State:** React Context (AuthContext)
- **Styling:** React Native StyleSheet

## Project Structure
```
app/               # Expo Router screens
  _layout.tsx      # Root layout with AuthProvider, SafeAreaProvider
  index.tsx        # Splash screen (redirects to /welcome)
  welcome.tsx      # Welcome/landing screen
  player-login.tsx # Player login
  owner-login.tsx  # Ground owner login
  signup.tsx       # Registration
  forgot-password.tsx
  dashboard.tsx    # Main post-auth screen
  (tabs)/          # Tab-based navigation
components/        # Shared UI components
constants/         # Theme, colors, typography
contexts/          # AuthContext
hooks/             # useAuth, useColorScheme, etc.
services/          # auth.ts (mock auth service)
template/          # Alert/UI template utilities
assets/images/     # splash-bg.jpg, welcome-hero.jpg, logo.png, etc.
```

## Running the App
- **Web:** Expo dev server on port 5000 via `npx expo start --web --port 5000`
- **Workflow:** "Start application" — runs the Expo web dev server

## Deployment
- **Target:** Static
- **Build:** `npx expo export --platform web`
- **Public Dir:** `dist`

## Key Notes
- Uses mock auth (no real backend/Supabase integration active)
- Auth state stored in AsyncStorage under `@playarena_session`
- Protected route guard in `_layout.tsx` (AuthGate component)
- No backend server — purely frontend/mobile app
