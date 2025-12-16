# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Google Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Enable **Google** authentication:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter a project support email
   - Click "Save"

## Step 3: Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location for your database
5. Click **Enable**

## Step 4: Firebase Configuration

The Firebase configuration is already set up in `src/firebase/config.js` with your project credentials. No changes needed!

## Step 5: Set Up Firestore Security Rules (Important!)

1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with these user-specific rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

## Step 6: Test Your Setup

1. Run the app: `npm run dev`
2. Click "Sign in with Google"
3. Complete the Google sign-in flow
4. Check Firebase Console to see if data is being saved

## Data Structure

Your Firestore database will have this structure:

```
users/
  {userId}/
    habits/
      {habitId}/
        name: string
        icon: string
        createdAt: timestamp
    habitCompletions/
      {completionId}/
        habitId: string
        date: timestamp
        completed: boolean
    dailyProgress/
      {progressId}/
        date: timestamp
        mood: number
        motivation: number
    tasks/
      {taskId}/
        task: string
        dueDate: timestamp
        priority: string
        status: string
        category: string
        completed: boolean
        createdAt: timestamp
```

## Troubleshooting

- **Authentication errors**: Make sure Google Sign-In is enabled in Firebase Console
- **Permission denied**: Check your Firestore security rules
- **Connection issues**: Verify your Firebase config values are correct
- **Data not saving**: Check browser console for errors and verify Firestore rules
- **Pop-up blocked**: Make sure your browser allows pop-ups for Google sign-in

## Notes

- The app uses **Google Sign-In only** - no email/password authentication
- All data is stored per user in Firestore
- Each user can only access their own data
