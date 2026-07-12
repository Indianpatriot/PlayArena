# PlayArena

PlayArena is a Progressive Web Application (PWA) built using React Native and Expo that simplifies sports venue booking for players while providing venue owners with a centralized platform to manage courts, slots, bookings, and customer feedback. The application supports both mobile and web platforms through a single codebase and uses Supabase as its backend for authentication, database management, and real-time operations.

---

## Features

### Player Module
- Secure user registration and login
- Search venues by sport, location, or venue name
- Browse available courts and time slots
- Real-time slot availability
- Book single or multiple slots
- Checkout with booking confirmation
- Digital ticket generation
- Booking history
- Submit ratings and feedback after game completion
- Progressive Web App (PWA) support

### Owner Module
- Secure owner authentication
- Owner dashboard
- Add, edit, and delete slots
- Court and venue management
- View upcoming bookings
- Revenue overview
- Booking statistics
- View customer ratings and feedback
- Restrict management to own venue using Row Level Security (RLS)

---

# Technology Stack

## Frontend
- React Native
- Expo
- Expo Router
- TypeScript

## Backend
- Supabase
- PostgreSQL

## UI Libraries
- React Native Paper
- Expo Vector Icons
- React Native Calendars
- Lottie React Native

## Progressive Web App
- Expo Web
- Service Worker
- Web Manifest

## Development Tools
- Git
- GitHub
- ESLint
- Babel

---

# Project Structure

```
PlayArena/
│
├── app/                    # Application screens
├── components/             # Reusable UI components
├── constants/              # Theme and constant values
├── hooks/                  # Custom React hooks
├── services/               # Supabase and authentication services
├── public/                 # PWA assets
├── assets/                 # Images and fonts
├── template/               # Configuration templates
└── package.json
```

---

# Getting Started

## Prerequisites

- Node.js (v18 or later recommended)
- npm or Yarn
- Expo CLI
- Git

---

## Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/PlayArena.git
```

Navigate to the project directory

```bash
cd PlayArena
```

Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

# Running the Project

Start the Expo development server

```bash
npm start
```

Run on Android

```bash
npm run android
```

Run on iOS

```bash
npm run ios
```

Run on Web

```bash
npm run web
```

Reset Metro cache

```bash
npm run reset-project
```

---

# Environment Setup

Create a `.env` file in the project root.

```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

# Database

The project uses Supabase PostgreSQL.

Main tables include:

- profiles
- slots
- bookings
- feedbacks

Authentication and authorization are managed using Supabase Auth and Row Level Security (RLS).

---

# Progressive Web App

PlayArena supports Progressive Web App functionality, including:

- Installable application
- Responsive layout
- Cross-platform compatibility
- Offline asset caching
- Web App Manifest
- Service Worker support

---

# Security

- Secure authentication using Supabase Auth
- Password hashing managed by Supabase
- Row Level Security (RLS)
- Protected owner resources
- Role-based access control

---

# Main Dependencies

| Package | Version |
|----------|----------|
| React | 19.0.0 |
| React Native | 0.79.4 |
| Expo | ~53.0.12 |
| Expo Router | ~5.1.0 |
| Supabase | ^2.50.0 |
| TypeScript | ~5.8.3 |
| React Native Paper | Latest |
| React Native Calendars | Latest |
| Lottie React Native | Latest |
| React Native WebView | Latest |

Refer to `package.json` for the complete dependency list.

---

# Scripts
# Getting Started

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v18 or later recommended)
- npm or Yarn
- Git
- Expo Go (for Android/iOS testing) or Android Studio/iOS Simulator

---

## Clone the Repository

```bash
git clone https://github.com/<your-username>/PlayArena.git
```

Navigate to the project folder:

```bash
cd PlayArena
```

---

## Install Dependencies

Using npm:

```bash
npm install
```

Or using Yarn:

```bash
yarn install
```

---

## Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials.

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Running the Application

### Start the Expo Development Server

```bash
npx expo start
```

or

```bash
npm start
```

---

### Run on Android

```bash
npx expo run:android
```

or

```bash
npm run android
```

---

### Run on iOS

```bash
npx expo run:ios
```

or

```bash
npm run ios
```

---

### Run on Web

```bash
npx expo start --web
```

or

```bash
npm run web
```

---

## Clear Metro Cache

```bash
npx expo start --clear
```

or

```bash
npm run reset-project
```

---

## Lint the Project

```bash
npm run lint
```

---

## Installing New Packages

For Expo-compatible libraries:

```bash
npx expo install <package-name>
```

Example:

```bash
npx expo install expo-router
npx expo install expo-image-picker
npx expo install expo-location
```

For normal npm packages:

```bash
npm install <package-name>
```

---

## Build for Android

```bash
eas build --platform android
```

---

## Build for iOS

```bash
eas build --platform ios
```

---

## Export Web Build

```bash
npx expo export --platform web
```

---

## Project Structure

```
PlayArena
│
├── app/                  # Expo Router screens
├── assets/               # Images, fonts, icons
├── components/           # Reusable UI components
├── constants/            # Theme and constants
├── hooks/                # Custom hooks
├── services/             # Authentication & Supabase
├── public/               # PWA assets
├── template/             # Project templates
├── package.json
└── README.md
```
# Screenshots

Add screenshots of the following modules:

- Player Login
- Player Dashboard
- Search & Venue Listing
- Slot Booking
- Checkout
- Digital Ticket
- Booking History
- Feedback Screen
- Owner Dashboard
- Slot Management

---

# Future Enhancements

- Online payment gateway integration
- Push notifications
- Google Maps integration
- AI-based venue recommendations
- Advanced analytics dashboard
- Multi-owner management
- QR code ticket verification

---

# Contributing

1. Fork the repository.
2. Create a new feature branch.

```bash
git checkout -b feature/your-feature
```

3. Commit your changes.

```bash
git commit -m "Describe your changes"
```

4. Push your branch.

```bash
git push origin feature/your-feature
```

5. Open a Pull Request.

---

# License

This repository is currently maintained as an academic project and is not intended for public distribution. All rights are reserved by the project contributors.

---

# Authors

Developed as part of the MCA academic project on Smart Sports Venue Booking and Management using React Native, Expo, Supabase, and PostgreSQL.