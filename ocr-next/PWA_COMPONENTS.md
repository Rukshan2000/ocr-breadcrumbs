# PWA Components Quick Reference

## Available Components

### 1. InstallPrompt
Shows native install UI for Android and manual instructions for iOS.

**Import:**
```typescript
import { InstallPrompt } from '@/components/InstallPrompt';
```

**Usage:**
```tsx
export default function App() {
  return (
    <>
      <YourMainComponent />
      <InstallPrompt />
    </>
  );
}
```

**Features:**
- Auto-detects Android/iOS
- Shows native Android install button
- Shows iOS manual instructions
- Hides when app is already installed

---

### 2. PushNotificationManager
Allows users to subscribe/unsubscribe from push notifications and send test notifications.

**Import:**
```typescript
import { PushNotificationManager } from '@/components/PushNotificationManager';
```

**Usage:**
```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PushNotificationManager />
    </div>
  );
}
```

**Features:**
- Subscribe to push notifications
- Unsubscribe from notifications
- Send test notifications
- Check notification permission status
- Error handling and user feedback

---

### 3. PWASettings
Complete settings modal with notifications, app info, and system status.

**Import:**
```typescript
import { PWASettings } from '@/components/PWASettings';
```

**Usage:**
```tsx
export default function App() {
  return (
    <>
      <YourMainComponent />
      <PWASettings />
    </>
  );
}
```

**Features:**
- Floating settings button (bottom-right)
- Push notification management tab
- App info and system status tab
- Installation instructions
- Feature list
- Responsive design (mobile and desktop)

---

### 4. ServiceWorkerRegistration
Registers the service worker on page load.

**Import:**
```typescript
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
```

**Usage (in layout):**
```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
```

**Features:**
- Registers `/public/sw.js`
- Logs registration status
- Error handling

---

## Recommended Integration Patterns

### Pattern 1: Minimal (Current Setup)
```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <>
      <OCRScanner />
      <InstallPrompt />
    </>
  );
}
```

### Pattern 2: Complete PWA Experience
```tsx
// src/app/page.tsx
import { PWASettings } from '@/components/PWASettings';

export default function Home() {
  return (
    <>
      <OCRScanner />
      <PWASettings />
    </>
  );
}
```

### Pattern 3: With Custom Navbar
```tsx
// src/app/page.tsx
import { InstallPrompt } from '@/components/InstallPrompt';

export default function Home() {
  return (
    <>
      <Navbar>
        <SettingsButton />
      </Navbar>
      <OCRScanner />
      <InstallPrompt />
    </>
  );
}
```

---

## Server Actions

### subscribeUser(subscription)
Subscribes a user to push notifications.

```typescript
import { subscribeUser } from '@/app/actions';

const serializedSub = JSON.parse(JSON.stringify(subscription));
await subscribeUser(serializedSub);
```

### unsubscribeUser()
Unsubscribes a user from push notifications.

```typescript
import { unsubscribeUser } from '@/app/actions';

await unsubscribeUser();
```

### sendNotification(message)
Sends a test push notification (requires web-push and VAPID keys).

```typescript
import { sendNotification } from '@/app/actions';

await sendNotification('Hello from OCR Scanner!');
```

### getSubscriptionsCount()
Returns the number of active subscriptions (admin use).

```typescript
import { getSubscriptionsCount } from '@/app/actions';

const { count } = await getSubscriptionsCount();
console.log(`${count} users subscribed to notifications`);
```

---

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your-email@example.com
```

Generate keys with:
```bash
npm run generate-vapid-keys
```

---

## Testing Checklist

- [ ] Service Worker registers (DevTools → Application → Service Workers)
- [ ] Manifest loads correctly (DevTools → Manifest)
- [ ] Install prompt appears on Android (or check address bar)
- [ ] iOS instructions appear on Safari
- [ ] Can subscribe to notifications
- [ ] Notifications can be sent and received
- [ ] Clicking notification opens app
- [ ] Works offline (DevTools → Offline mode)
- [ ] Icons load correctly in manifest
- [ ] HTTPS is enabled

---

## Styling

All components use Tailwind CSS classes. Customize by:

1. **Modify component files directly** - Edit colors, spacing in component JSX
2. **Override Tailwind config** - Change `tailwind.config.js`
3. **Use CSS modules** - Create `.module.css` files if preferred

Example: Change button colors in `InstallPrompt.tsx`:
```tsx
// Before
className="px-4 py-2 bg-blue-600 text-white"

// After  
className="px-4 py-2 bg-green-600 text-white"
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✅ | ✅ | ✅ (iOS 15.1+) | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Web App Manifest | ✅ | ✅ | ⚠️ (limited) | ✅ |

---

## Troubleshooting

### Install prompt not showing?
- Are you using HTTPS? (required for PWA)
- Is the manifest.json valid?
- Check DevTools → Application → Manifest

### Notifications not working?
- Did you grant notification permission?
- Are VAPID keys configured?
- Check browser notification settings

### Service Worker not registering?
- Is `/public/sw.js` present?
- Check DevTools → Application → Service Workers
- Look for errors in console

### Still having issues?
- Check `PWA_SETUP_GUIDE.md` for detailed troubleshooting
- Review browser DevTools for error messages
- Test on different browsers

---

## Next Steps

1. Copy `.env.example` to `.env.local`
2. Generate VAPID keys: `npm run generate-vapid-keys`
3. Add keys to `.env.local`
4. Run dev server with HTTPS: `npm run dev:https`
5. Test PWA features in your app
6. For production: update database integration in `app/actions.ts`

---

## Additional Resources

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Next.js: PWA Support](https://nextjs.org/docs)
