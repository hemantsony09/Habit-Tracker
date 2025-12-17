// Quick script to verify environment variables are loaded
// Run: node check-env.js

require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('Checking environment variables...\n');

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log('\n✅ All environment variables are present!');
  console.log('\n⚠️  IMPORTANT: Next.js needs to be restarted to load .env.local');
  console.log('   1. Stop your dev server (Ctrl+C)');
  console.log('   2. Run: npm run dev');
} else {
  console.log('\n❌ Some environment variables are missing!');
  console.log('   Please check your .env.local file.');
}

