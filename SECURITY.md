# Security Guide for Production Deployment

This document outlines security measures and best practices for deploying the Habit Tracker application to production.

## 🔒 Security Checklist

### ✅ Completed Security Measures

1. **Firebase Security Rules** - User data isolation enforced at database level
2. **Authentication** - Google OAuth only, no password storage
3. **Input Validation** - All user inputs are validated and sanitized
4. **Security Headers** - CSP, XSS protection, frame options, etc.
5. **Environment Variables** - Sensitive config moved to env vars
6. **HTTPS Enforcement** - Strict Transport Security header
7. **Content Security Policy** - Restricts resource loading

### ⚠️ Required Actions Before Production

#### 1. Firebase Security Rules

**CRITICAL:** Ensure Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Steps:**
1. Go to Firebase Console → Firestore Database → Rules
2. Paste the rules above
3. Click "Publish"
4. Test rules using the Rules Playground

#### 2. Environment Variables

**Create `.env.local` file** (DO NOT commit this file):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**For Production Deployment:**
- Vercel: Add these in Project Settings → Environment Variables
- Netlify: Add these in Site Settings → Environment Variables
- Other platforms: Configure according to their documentation

#### 3. Firebase API Key Restrictions

**Recommended:** Restrict Firebase API key in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to "APIs & Services" → "Credentials"
4. Find your API key
5. Click "Edit" and add restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your production domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Restrict to Firebase APIs only

#### 4. Firebase Authentication Settings

1. Go to Firebase Console → Authentication → Settings
2. **Authorized domains**: Add your production domain
3. **OAuth redirect URLs**: Verify your production URL is listed
4. **Email/Password**: Keep disabled (using Google OAuth only)

#### 5. Remove Console Logs (Optional but Recommended)

Before production, consider removing or disabling verbose console logs:

- Search for `console.log` in the codebase
- Replace with a logging service or remove entirely
- Keep `console.error` for error tracking

#### 6. Rate Limiting

Consider implementing rate limiting for API calls:

- **Firebase App Check**: Enable in Firebase Console
- **Cloud Functions**: Add rate limiting middleware if using Cloud Functions
- **CDN/Proxy**: Configure rate limiting at infrastructure level (Vercel/Netlify)

#### 7. Monitoring and Error Tracking

Set up error tracking:

- **Firebase Crashlytics**: Enable for error tracking
- **Sentry**: Alternative error tracking service
- **Google Analytics**: Already configured for usage analytics

#### 8. Backup and Recovery

1. **Firestore Backups**: Enable automated backups in Firebase Console
2. **Export Data**: Regularly export user data for backup
3. **Disaster Recovery Plan**: Document recovery procedures

## 🛡️ Security Features Explained

### Content Security Policy (CSP)

The CSP header restricts which resources can be loaded:
- Prevents XSS attacks
- Blocks unauthorized script execution
- Controls resource loading (images, fonts, etc.)

### Strict Transport Security (HSTS)

Forces HTTPS connections:
- Prevents man-in-the-middle attacks
- Ensures encrypted communication
- 2-year max-age for long-term protection

### Input Validation

All user inputs are validated:
- Prevents injection attacks
- Limits input length
- Sanitizes dangerous characters
- Validates data types and formats

### Firebase Security Rules

Database-level security:
- Users can only access their own data
- Authentication required for all operations
- Prevents unauthorized data access

## 🔍 Security Testing

Before deploying to production:

1. **Test Authentication Flow**
   - Verify Google OAuth works correctly
   - Test logout functionality
   - Verify session persistence

2. **Test Authorization**
   - Try accessing another user's data (should fail)
   - Verify Firestore rules block unauthorized access
   - Test with different user accounts

3. **Test Input Validation**
   - Try submitting malicious inputs (XSS attempts, SQL injection, etc.)
   - Verify inputs are sanitized
   - Test edge cases (empty strings, very long strings, special characters)

4. **Test Security Headers**
   - Use [SecurityHeaders.com](https://securityheaders.com/) to test
   - Verify CSP doesn't break functionality
   - Check HSTS is working

5. **Penetration Testing**
   - Consider hiring a security professional
   - Use automated security scanners
   - Review OWASP Top 10 vulnerabilities

## 📋 Pre-Deployment Checklist

- [ ] Firestore security rules configured and tested
- [ ] Environment variables set in production
- [ ] Firebase API key restrictions configured
- [ ] Authorized domains added in Firebase
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] Security headers verified
- [ ] Input validation tested
- [ ] Error tracking configured
- [ ] Backups enabled
- [ ] Console logs reviewed/removed
- [ ] Performance tested
- [ ] Load testing completed
- [ ] Documentation updated

## 🚨 Incident Response

If a security incident occurs:

1. **Immediately**: Revoke compromised credentials
2. **Assess**: Determine scope of breach
3. **Contain**: Isolate affected systems
4. **Notify**: Inform affected users if necessary
5. **Fix**: Patch vulnerabilities
6. **Review**: Conduct post-incident review

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## ⚠️ Important Notes

1. **Firebase Client Keys**: Firebase API keys are meant to be public in client-side apps. Security comes from Firestore rules, not key secrecy.

2. **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-side variables. Never expose server-side secrets.

3. **Regular Updates**: Keep dependencies updated:
   ```bash
   npm audit
   npm update
   ```

4. **Security Monitoring**: Regularly review:
   - Firebase Console → Usage and billing
   - Authentication logs
   - Firestore access patterns
   - Error logs

## ✅ Production Ready

Once all checklist items are completed, your application is ready for production deployment!

