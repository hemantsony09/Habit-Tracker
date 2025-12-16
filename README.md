# Habit Tracker & Task List Web App

A beautiful web application for tracking daily habits and managing tasks, built with Next.js, React, and Firebase. Supports multiple users with secure authentication and cloud data storage.

## Features

### Authentication
- **Google Sign-In only** - Simple one-click authentication
- Secure authentication using Firebase Auth
- Protected routes - users can only access their own data

### Habit Tracker
- Add, edit, and delete custom habits
- Monthly habit tracking grid with checkboxes
- Daily progress summary (Done/Not Done)
- Progress trend graphs
- Individual habit analysis (Goal vs Actual)
- Mental state tracking (Mood & Motivation)
- Mental state trend visualization
- Date labels for mood and motivation tracking

### Task List
- Task management with due dates, priorities, and categories
- Summary statistics (Today, Total, Overdue, Not Completed)
- Progress bar showing completion percentage
- Filter tasks by status (All, Today, Overdue, Active)
- Sort tasks by due date, priority, or status
- Color-coded due dates (green for today, red for overdue)
- Task categories: Work, Money B, Ideas, Chores, Spirituality, Health

## Prerequisites

- Node.js (v18 or higher)
- Firebase account (free tier works)
- npm or yarn

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd "Habit Tracker"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your Firebase credentials
   # Get these from: Firebase Console → Project Settings → General → Your apps
   ```

4. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a Firebase project (or use existing)
   - Enable **Google Authentication** in Authentication section
   - Create **Firestore Database** (start in test mode for development)
   - Get your Firebase config values from Project Settings → General → Your apps
   - Add these values to your `.env.local` file

5. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Click "Sign in with Google" to authenticate
   - After signing in, you'll be redirected to the dashboard

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the Next.js development server with hot-reload enabled.

### Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## Deployment

This Next.js app can be deployed to:
- **Vercel** (recommended) - `vercel deploy`
  - **Important:** Add all environment variables from `.env.local` to Vercel project settings
  - Go to: Project Settings → Environment Variables
  - Add each `NEXT_PUBLIC_*` variable from your `.env.local` file
- **Netlify** - Connect your GitHub repository
  - Add environment variables in Site Settings → Environment Variables
- **Any Node.js hosting** - Run `npm run build && npm start`
  - Make sure to set all environment variables in your hosting platform

**Note:** Never commit `.env.local` to git. It's already in `.gitignore`.

## Data Storage

The app uses **Firebase Firestore** to store all data in the cloud:
- User authentication and profiles
- Habits and their definitions (per user)
- Daily habit completions (per user)
- Daily progress - mood and motivation (per user)
- Tasks with all their properties (per user)

**Data Isolation:** Each user's data is completely isolated. Users can only access their own habits, tasks, and progress data.

## Custom Habits

The app starts with an empty habit list. You can:
- Add custom habits with names and icons
- Edit existing habits
- Delete habits (with confirmation)
- Choose from 24+ emoji icons

## Project Structure

```
Habit Tracker/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout
│   ├── page.js            # Dashboard (home page)
│   ├── login/             # Login page
│   │   └── page.js
│   ├── signup/            # Signup page
│   │   └── page.js
│   ├── globals.css        # Global styles
│   └── auth.css           # Auth page styles
├── src/
│   ├── App.css            # App component styles
│   ├── components/        # React components
│   │   ├── HabitTracker.js
│   │   ├── HabitTracker.css
│   │   ├── TaskList.js
│   │   └── TaskList.css
│   ├── contexts/          # React context
│   │   └── AuthContext.js # Authentication context
│   ├── firebase/          # Firebase configuration
│   │   └── config.js      # Firebase setup
│   └── services/          # API services
│       └── firebaseApi.js # Firebase Firestore operations
├── next.config.js         # Next.js configuration
├── jsconfig.json          # JavaScript path aliases
└── package.json           # Dependencies and scripts
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Firebase** - Authentication and cloud database
- **Firestore** - NoSQL cloud database
- **Chart.js** - Data visualization
- **date-fns** - Date manipulation

## Troubleshooting

### Firebase Connection Issues
- Verify your Firebase config values in `.env.local` file
- Make sure all required environment variables are set (see `.env.example`)
- Ensure `.env.local` exists and contains all Firebase configuration
- Make sure Google Authentication is enabled in Firebase Console
- Check Firestore security rules (see FIREBASE_SETUP.md)
- Ensure you're logged in before accessing data

### Authentication Issues
- Make sure Google Sign-In is enabled in Firebase Console
- Check that you're allowing popups (required for Google sign-in)
- Verify your Firebase project has Google authentication provider enabled

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next && npm run build`

## License

This project is for personal use.
