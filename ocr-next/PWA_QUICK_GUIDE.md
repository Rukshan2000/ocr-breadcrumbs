# ⚡ PWA Quick Action Guide

Fast reference for common PWA tasks. For detailed info, see other PWA_*.md files.

---

## 🚀 Get Started (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Generate VAPID keys
npm run generate-vapid-keys

# 3. Copy template
cp .env.example .env.local

# 4. Edit .env.local
# Add VAPID keys from step 2

# 5. Run dev server
npm run dev:https

# 6. Open browser
open https://localhost:3000
```

---

## ✅ Verify Setup

```bash
# Run verification script
bash check-pwa-setup.sh

# Manually check:
# 1. DevTools → Application → Service Workers
# 2. DevTools → Application → Manifest
# 3. DevTools → Console (no errors?)
```

---

## 🧪 Test Features

### Android
- [ ] Open on real Android device
- [ ] See install prompt at bottom
- [ ] Click "Install"
- [ ] App appears on home screen
- [ ] Launch and test notifications

### iOS
- [ ] Open on Safari on iPhone/iPad
- [ ] See manual instructions
- [ ] Follow: Share → Add to Home Screen
- [ ] App on home screen
- [ ] Test notifications

### Desktop
- [ ] Open in Chrome/Edge
- [ ] Look for install icon in address bar
- [ ] Click to install
- [ ] Test notifications

---

## 🔔 Push Notifications

### Subscribe User
```typescript
import { subscribeUser } from '@/app/actions';

const subscription = await registration.pushManager.subscribe({...});
const serialized = JSON.parse(JSON.stringify(subscription));
await subscribeUser(serialized);
```

### Send Notification
```typescript
import { sendNotification } from '@/app/actions';

await sendNotification('Your message here');
```

### Test in Browser Console
```javascript
// List all subscriptions
navigator.serviceWorker.getRegistrations()
  .then(registrations => registrations[0].pushManager.getSubscription())
  .then(sub => console.log(sub));
```

---

## 🎨 Customize

### Change App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "YourApp"
}
```

### Change Colors
Edit `public/manifest.json`:
```json
{
  "theme_color": "#0066cc",
  "background_color": "#ffffff"
}
```

### Change Icons
Replace images in `/public/icons/`
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

### Modify Components
Edit component files:
- `src/components/InstallPrompt.tsx`
- `src/components/PushNotificationManager.tsx`
- `src/components/PWASettings.tsx`

---

## 🐛 Troubleshooting

### Service Worker Not Registering
```javascript
// DevTools Console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs));

// Check /public/sw.js exists
// Check HTTPS enabled
// Clear cache & reload
```

### Notifications Not Showing
1. Check notification permission granted
2. Check VAPID keys in .env.local
3. Check service worker active
4. Check browser notifications not muted

### Install Prompt Not Appearing
1. Verify using HTTPS
2. Check manifest.json valid
3. Clear browser cache
4. Check icons exist in /public/icons/
5. Try incognito mode

### HTTPS Certificate Warnings
1. Normal for self-signed (dev only)
2. Click "Proceed anyway"
3. Use proper certificate for production

---

## 📱 Test on Real Device

### Android
```bash
# 1. Get your machine IP
ipconfig getifaddr en0  # Mac
hostname -I             # Linux
ipconfig               # Windows

# 2. Set up HTTPS proxy or tunnel
ngrok http https://localhost:3000

# 3. Open URL on Android device
# Device will access your local server
```

### iOS
```bash
# 1. Use HTTPS on same WiFi
npm run dev:https

# 2. Find your machine IP
ifconfig

# 3. Open on iPhone Safari
https://YOUR_IP:3000

# 4. Test install & notifications
```

---

## 🚢 Deploy to Production

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
```
Vercel handles HTTPS automatically.

### Other Platforms
1. Set up SSL certificate (Let's Encrypt)
2. Configure environment variables
3. Set VAPID keys on platform
4. Deploy Next.js app normally
5. Test PWA features

### Pre-Production Checklist
- [ ] HTTPS working
- [ ] VAPID keys configured
- [ ] Database ready for subscriptions
- [ ] Icons and manifest validated
- [ ] Service worker no errors
- [ ] Lighthouse audit passed
- [ ] Tested on real devices

---

## 📊 Monitor & Maintain

### Check Service Worker Status
```javascript
// In console
navigator.serviceWorker.ready
  .then(reg => console.log('SW ready', reg))
  .catch(e => console.error('SW error', e));
```

### Monitor Subscriptions
```typescript
import { getSubscriptionsCount } from '@/app/actions';

const { count } = await getSubscriptionsCount();
console.log(`${count} users subscribed`);
```

### Test Notification Delivery
```typescript
import { sendNotification } from '@/app/actions';

// Send test to all subscribers
await sendNotification('Test message');
```

### Update Service Worker
Service Worker updates automatically (no-cache headers).
Clear cache to get latest version:
```javascript
// DevTools
DevTools → Storage → Clear Site Data
```

---

## 🔐 Security Checklist

- [ ] HTTPS enforced everywhere
- [ ] VAPID private key not in code
- [ ] Environment variables secure
- [ ] CSP headers configured
- [ ] CORS properly set
- [ ] Input validation present
- [ ] No sensitive data in cache
- [ ] Regular security audits

---

## ⚡ Performance Tips

### Optimize Caching
```javascript
// In sw.js: cache only essential files
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png'
];
```

### Reduce Bundle Size
```typescript
// Use dynamic imports
const Component = dynamic(() => import('./Heavy'), {
  loading: () => <div>Loading...</div>
});
```

### Lazy Load Non-Critical
```typescript
// defer non-essential subscriptions
setTimeout(() => {
  navigator.serviceWorker.register('/sw.js');
}, 5000);
```

---

## 🎯 Common Tasks

### Add New Notification Feature
1. Extend `sendNotification()` in `app/actions.ts`
2. Update payload in `public/sw.js`
3. Test with browser notification API

### Integrate with Database
1. Create subscription table
2. Replace in-memory storage in `app/actions.ts`
3. Update `subscribeUser()` and `sendNotification()`

### Add Service Worker Update Check
1. Add update check in `ServiceWorkerRegistration.tsx`
2. Notify user of available update
3. Allow user to refresh

### Customize Notification UI
1. Edit `sendNotification()` options
2. Change icon, badge, vibration
3. Add action buttons
4. Update notification click handler

---

## 📞 Quick Help

### Where to...

...find component source?
→ `/src/components/InstallPrompt.tsx`, `PushNotificationManager.tsx`, etc.

...configure VAPID keys?
→ Create `.env.local` with keys

...change app name?
→ Edit `public/manifest.json`

...update security headers?
→ Edit `next.config.js` → `headers()`

...modify caching?
→ Edit `public/sw.js` → `CACHE_NAME` & `STATIC_ASSETS`

...see error messages?
→ DevTools → Console tab

...check service worker?
→ DevTools → Application → Service Workers

...test offline?
→ DevTools → Network → Offline (checkbox)

...clear cache?
→ DevTools → Storage → Clear Site Data

---

## 🆘 Emergency Help

### Nothing Works
1. Clear browser cache: DevTools → Storage → Clear
2. Check console for errors: F12
3. Verify .env.local has VAPID keys
4. Ensure HTTPS: npm run dev:https
5. Reload page: Ctrl+Shift+R (hard refresh)

### Service Worker Stuck
```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
```

### Notifications Not Working
1. Check permission granted
2. Check browser notification settings
3. Check VAPID keys valid
4. Verify service worker running

### Install Prompt Missing
1. Using HTTPS? Required!
2. Icons in /public/icons/? Required!
3. Manifest valid? Check DevTools
4. Try incognito mode

---

## 📚 Documentation Map

```
PWA_INDEX.md ←─ START HERE
    │
    ├─ PWA_README.md (Quick overview)
    ├─ PWA_IMPLEMENTATION_SUMMARY.md (What's included)
    ├─ PWA_SETUP_GUIDE.md (Detailed setup)
    ├─ PWA_COMPONENTS.md (Component reference)
    ├─ PWA_VISUAL_GUIDE.md (Diagrams)
    └─ This file (Quick actions)
```

---

## ✨ Pro Tips

- 💡 Use incognito mode to test as new user
- 💡 Test on real devices early
- 💡 Clear cache between changes
- 💡 Check DevTools Application tab first
- 💡 Read browser console for hints
- 💡 Use Lighthouse for PWA audit
- 💡 Test offline mode in DevTools
- 💡 Keep VAPID keys safe

---

## 🎉 That's It!

You now have a fully functional PWA. 

**Next step:** Run `npm run dev:https` and test! 🚀

For more details, check the main documentation files.
