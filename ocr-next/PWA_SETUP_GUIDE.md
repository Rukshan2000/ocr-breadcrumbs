# PWA Setup Guide for OCR Scanner

This guide walks you through setting up and configuring the Progressive Web App (PWA) features for the OCR Scanner application.

## 🎯 What's Included

- ✅ **Web App Manifest** - Already configured in `/public/manifest.json`
- ✅ **Service Worker** - Caching strategy and offline support in `/public/sw.js`
- ✅ **Security Headers** - Configured in `next.config.js`
- ✅ **Install Prompt** - Auto-detect and show install UI for Android/iOS
- ✅ **Push Notifications** - Subscribe, manage, and send notifications
- ✅ **HTTPS Support** - Ready for secure PWA features

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

This will install `web-push` which is needed for server-side push notifications.

### 2. Generate VAPID Keys

VAPID keys are required for push notifications. Generate them using:

```bash
npm run generate-vapid-keys
```

This command will output:
```
Public Key: BIFxLKnSNKlylR2P_1A-9v7L8g2ylF4tQWXZw1aOFXlAeZ5BhjXY3TqL6q4VD8Z9KqZ9GhFj3R2L8v7L9g2y
Private Key: AIFxLKnSNKlylR2P_1A-9v7L8g2ylF4tQWXZw1aOFXlAeZ5BhjXY3TqL6q4VD8Z9
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your VAPID keys:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_from_step_2
VAPID_PRIVATE_KEY=your_private_key_from_step_2
VAPID_EMAIL=mailto:your-email@example.com
```

⚠️ **Important**: 
- The `NEXT_PUBLIC_` prefix means this key will be exposed to the browser (public key)
- Keep `VAPID_PRIVATE_KEY` secret and only on the server
- Never commit `.env.local` to version control

### 4. Run Development Server with HTTPS

PWA features require HTTPS. Use the experimental HTTPS mode:

```bash
npm run dev:https
```

This starts the development server with self-signed HTTPS certificates.

### 5. Test the PWA

1. **Open Browser**: Navigate to `https://localhost:3000`
2. **Install Prompt**: 
   - On Android: You'll see an install button at the bottom
   - On iOS: See manual installation instructions
   - On Desktop (Chrome/Edge): Check the address bar for an install icon
3. **Push Notifications**:
   - Look for the InstallPrompt component at the bottom
   - Find settings button (gear icon) if integrated
   - Subscribe to notifications
   - Send test notifications

## 📁 File Structure

```
ocr-next/
├── .env.example                           # Example env variables
├── next.config.js                         # Security headers & PWA config
├── public/
│   ├── manifest.json                      # Web app manifest
│   ├── sw.js                              # Service worker (push + caching)
│   └── icons/                             # App icons (72x72 to 512x512)
└── src/
    ├── app/
    │   ├── actions.ts                     # Server actions for push
    │   ├── page.tsx                       # Main page with install prompt
    │   └── layout.tsx                     # Root layout with metadata
    └── components/
        ├── InstallPrompt.tsx              # Install UI component
        ├── PushNotificationManager.tsx    # Push notification UI
        └── ServiceWorkerRegistration.tsx  # SW registration
```

## 🔑 Key Components

### InstallPrompt.tsx
Shows native install prompts for Android and manual instructions for iOS.

**Features**:
- Auto-detects device type (Android, iOS, Desktop)
- Shows install button on Android
- Shows manual instructions for iOS
- Respects existing installations

### PushNotificationManager.tsx
Manages push notification subscriptions and testing.

**Features**:
- Subscribe/unsubscribe to notifications
- Check browser support
- Handle permission requests
- Send test notifications
- Visual feedback and error handling

### Service Worker (sw.js)
Handles offline caching and push notifications.

**Features**:
- Network-first caching strategy
- Push event handling
- Notification click tracking
- Offline fallback

### Server Actions (app/actions.ts)
Backend logic for managing push subscriptions.

**Functions**:
- `subscribeUser()` - Save subscription
- `unsubscribeUser()` - Remove subscription
- `sendNotification()` - Send push notification
- `getSubscriptionsCount()` - Admin function

## 🔒 Security Configuration

The PWA includes security headers configured in `next.config.js`:

### Global Headers
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `Referrer-Policy` - Control referrer information
- `Permissions-Policy` - Control browser features (camera, mic, geo)

### Service Worker Headers
- `Cache-Control: no-cache` - Always get latest SW
- `Content-Security-Policy` - Strict CSP for SW
- `Content-Type: application/javascript` - Proper MIME type

## 📱 Installation Methods

### Android
1. Browser shows install prompt automatically
2. User clicks "Install" button
3. App appears on home screen as a shortcut
4. App launches in fullscreen "standalone" mode

### iOS
1. User taps Share button at bottom
2. Scrolls to "Add to Home Screen"
3. Chooses app name
4. Taps Add
5. App launches in fullscreen mode when opened from home screen

### Desktop
1. Modern browsers show install icon in address bar
2. Click to install
3. Creates app window (similar to installed app)

## 🔔 Push Notifications Flow

### Client Side
1. Service Worker registers
2. User sees push notification manager
3. User clicks "Subscribe"
4. Browser requests notification permission
5. Client sends subscription to server

### Server Side
1. Server receives subscription object
2. Stores subscription in memory (or database)
3. When sending notification, uses web-push library
4. Sends encrypted payload to push service

### Receiving Notifications
1. Push service delivers message to Service Worker
2. Service Worker displays notification
3. User can click to open app
4. Notification click is tracked

## ⚠️ Troubleshooting

### Notifications Not Working

**Problem**: Notifications don't appear when sent

**Solutions**:
1. Check VAPID keys are set correctly
2. Verify user has granted notification permission
3. Ensure service worker is registered (check DevTools)
4. Check browser notification settings aren't muted globally
5. Verify notifications are enabled for the specific site

### Install Prompt Not Showing

**Problem**: Install button doesn't appear on Android

**Solutions**:
1. Using HTTPS? PWA requires HTTPS
2. Clear browser cache and reload
3. Check manifest.json is valid and accessible
4. Verify icons are present in `/public/icons/`
5. Open DevTools and check for errors in console

### Service Worker Issues

**Problem**: Service worker fails to register

**Solutions**:
1. Check `/public/sw.js` exists
2. Verify HTTPS is enabled (even for localhost)
3. Check browser DevTools -> Application -> Service Workers
4. Clear service worker cache: DevTools -> Storage -> Clear
5. Check console for registration errors

### HTTPS Certificate Errors

**Problem**: Browser warns about untrusted certificate

**Solutions**:
1. This is normal for self-signed certificates in development
2. Click "Proceed anyway" or similar option
3. For production, use proper SSL certificates
4. Or disable HTTPS warnings in Chrome: chrome://flags/#allow-insecure-localhost

## 🛠️ Database Integration (Production)

The current implementation stores subscriptions in memory. For production, integrate a database:

```typescript
// Example with Prisma
const subscription = await prisma.pushSubscription.create({
  data: {
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    userId: user.id,
  },
});

// When sending notifications
const subscriptions = await prisma.pushSubscription.findMany();
for (const sub of subscriptions) {
  // Send notification...
}
```

## 📚 Additional Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Next.js PWA Docs](https://nextjs.org/docs)
- [Web Push Protocol Spec](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol)
- [Caniuse: Push API](https://caniuse.com/push-api)

## 📝 Testing Checklist

- [ ] Install manifest loads without errors
- [ ] Service Worker registers successfully
- [ ] HTTPS works (no certificate warnings)
- [ ] Install prompt shows on Android
- [ ] Manual install instructions show on iOS
- [ ] Push notification permission can be requested
- [ ] User can subscribe to notifications
- [ ] Test notifications can be sent and received
- [ ] Notification click opens app
- [ ] Offline functionality works
- [ ] App appears on home screen after install
- [ ] Standalone mode hides browser UI

## 🎨 Customization

### Update App Name and Description
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Your App",
  "description": "Your description",
  ...
}
```

### Update Colors
Edit `public/manifest.json` and `src/app/layout.tsx`:
```json
{
  "theme_color": "#your_color",
  "background_color": "#your_color"
}
```

### Update Icons
Replace images in `/public/icons/` with your own icons (PNG format).
Required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Customize Install Prompt UI
Edit `src/components/InstallPrompt.tsx` to match your design.

### Customize Notification UI
Edit `src/components/PushNotificationManager.tsx` for different styling.

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Vercel automatically handles HTTPS and PWA requirements.

### Other Platforms
1. Ensure HTTPS is enabled
2. Set environment variables on hosting platform
3. Deploy as normal Next.js app
4. Test PWA features after deployment

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser DevTools console for errors
3. Check Service Worker status in DevTools -> Application
4. Verify manifest and icons are accessible
5. Test on different browsers (Chrome, Firefox, Safari, Edge)
