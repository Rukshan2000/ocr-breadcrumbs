# 📱 Mobile PWA Installation Troubleshooting

## Quick Checklist for Your Mobile Device

### ✅ What You Should See

**Android Phone:**
- [ ] Blue bar at bottom of screen saying "📱 Install OCR Scanner"
- [ ] Two buttons: "Not now" and "Install"
- [ ] Click "Install" → App on home screen

**iPhone/iPad:**
- [ ] Purple bar at bottom with instructions
- [ ] Instructions: Tap Share → Add to Home Screen
- [ ] Follow steps to install

**Both:**
- [ ] Yellow debug bar at very bottom (technical info)
- [ ] Shows device type and capabilities

---

## 🔧 How to Test on Mobile

### Step 1: Find Your PC's IP Address

#### On Linux/Mac Terminal:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

You'll see something like: `192.168.x.x` or `10.x.x.x`

#### On Windows Command Prompt:
```bash
ipconfig
```
Look for "IPv4 Address"

### Step 2: Access from Mobile Phone

Open browser on your phone and go to:
```
https://YOUR_IP:3000
```

**Examples:**
- `https://192.168.1.100:3000`
- `https://10.0.0.50:3000`

⚠️ **Important:**
- Phone must be on **same WiFi network** as your PC
- Use **HTTPS** (not HTTP)
- Ignore certificate warning (tap "Continue anyway" or "Proceed")

### Step 3: Check Debug Bar

At the bottom of the app, you should see:
```
DEBUG: Device: Android/iOS/Desktop
Standalone: false/true
UserAgent: [your device info]
PWA Support: Yes/No
```

This tells you if PWA is being detected correctly.

---

## ⚠️ Common Issues & Fixes

### Issue 1: Can't Access from Phone

**Problem:** Getting "ERR_CONNECTION_REFUSED" or page won't load

**Solutions:**
1. **Check IP address is correct**
   - Verify you're using right IP from `ipconfig` or `ifconfig`
   - Don't use `localhost` on phone - only on computer

2. **Check both devices on same WiFi**
   - Phone WiFi = same WiFi as PC
   - Not on different networks

3. **Check firewall**
   - Windows: Allow Node.js through firewall
   - Mac: Check System Preferences → Security
   - Linux: `sudo ufw allow 3000` (if using ufw)

4. **Restart dev server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev:https
   ```

### Issue 2: No Install Prompt Showing

**Problem:** Blue/purple bar at bottom doesn't appear

**What to check:**

1. **Is debug bar showing?**
   - If yellow debug bar at bottom shows "Device: Android/iOS" → Keep reading
   - If not showing anything → Service Worker not loading

2. **Already installed?**
   - Debug bar shows "Standalone: true" → Already installed (no prompt shown)
   - Look for app icon on home screen
   - Uninstall: Remove from home screen

3. **Service Worker not running**
   - Open browser DevTools (F12 or right-click → Inspect)
   - Go to "Application" tab
   - Check "Service Workers" - should show active and running
   - If gray/offline → Click "Skip waiting" to activate

4. **Manifest not loading**
   - DevTools → Application tab
   - Check "Manifest" section
   - Should show app name, icons, etc.
   - If error: Check `/public/manifest.json` is valid

5. **Icons missing**
   - DevTools → Application → Manifest
   - See "App Icons" section
   - Check if icons have green checkmarks or red X
   - If red X: Icons are missing or wrong path
   - Solution: Copy icons to `/public/icons/`

### Issue 3: Install Button Does Nothing

**Problem:** Click install, nothing happens

**Solutions:**

1. **Check browser supports PWA**
   - Android Chrome: ✅ Supported
   - Android Firefox: ✅ Supported
   - iPhone Safari: ⚠️ Limited (manual only)
   - Samsung Internet: ✅ Supported

2. **Check HTTPS is working**
   - URL must be `https://` not `http://`
   - Green lock icon in address bar
   - No certificate warnings (or ignored warnings are OK)

3. **Grant permissions**
   - Notification permission must be granted
   - When prompted: Tap "Allow"

4. **Refresh page**
   - Pull down to refresh
   - Or close tab and reopen

5. **Clear cache**
   - DevTools → Storage → Clear Site Data
   - Reload page

### Issue 4: Service Worker Not Registering

**Problem:** Debug bar shows "PWA Support: No" or no debug bar visible

**Solutions:**

1. **Check HTTPS is enabled**
   ```bash
   # Must use this:
   npm run dev:https
   
   # NOT this:
   npm run dev
   ```

2. **Check manifest is linked**
   - Source code → See `<link rel="manifest"...`
   - Should be in `<head>` section

3. **Check `/public/sw.js` exists**
   - File must be at `/public/sw.js`
   - Not in `/src/public` or other location

4. **Reload page (hard refresh)**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)
   - Or: DevTools → Network → Disable cache (check box)

### Issue 5: Certificate Error on Mobile

**Problem:** "Your connection is not private" or similar warning

**This is expected for development.**

**Fix:**
- Tap "Details" or "Advanced"
- Tap "Proceed anyway" or "Continue"
- Page will load
- PWA features still work

**For Production:**
- Get proper SSL certificate (Let's Encrypt is free)
- Self-signed only for development

---

## 🔍 Debugging Steps

### Step 1: Check Debug Bar
Yellow bar at bottom of app shows:
- Device type detected (Android/iOS/Desktop)
- Standalone mode (already installed?)
- User agent string
- PWA support available

### Step 2: Check Browser DevTools
Open on phone:
- Long-press address bar → "Inspect" or "Inspect element"
- Or: F12 key on phone browser

Look at:
1. **Console Tab**
   - Check for red error messages
   - Should see "beforeinstallprompt event fired!" for Android

2. **Application Tab → Service Workers**
   - Check box: "Bypass for network"
   - Should show `/sw.js` as active/running
   - If offline/gray: Click "Skip waiting"

3. **Application Tab → Manifest**
   - Should load successfully
   - Show name, icons, colors
   - No red errors

4. **Network Tab**
   - Check status of `/manifest.json` (should be 200)
   - Check status of `/sw.js` (should be 200)
   - Check status of `/icons/*.png` (should be 200)

### Step 3: Console Commands

In DevTools Console, run:

```javascript
// Check if SW is registered
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length > 0))

// Check manifest
fetch('/manifest.json').then(r => r.json())
  .then(m => console.log('Manifest:', m))

// List all cache storage
caches.keys().then(keys => console.log('Caches:', keys))
```

---

## 📋 Complete Android Checklist

- [ ] Device on same WiFi as PC
- [ ] Using correct IP address (not localhost)
- [ ] URL is `https://` not `http://`
- [ ] Ignored certificate warning
- [ ] Debug bar shows "Device: Android"
- [ ] Debug bar shows "PWA Support: Yes"
- [ ] Service Worker is active (DevTools → Application)
- [ ] Manifest loads correctly (DevTools → Manifest)
- [ ] No red errors in console
- [ ] Blue install bar appears at bottom
- [ ] Click Install button
- [ ] Tap Install on system prompt
- [ ] App appears on home screen ✅

## 📋 Complete iOS Checklist

- [ ] Device on same WiFi as PC
- [ ] Using correct IP address
- [ ] Using Safari browser
- [ ] URL is `https://`
- [ ] Ignored certificate warning
- [ ] Debug bar shows "Device: iOS"
- [ ] Purple install instructions show
- [ ] See instructions to tap Share button
- [ ] Open Share menu
- [ ] Tap "Add to Home Screen"
- [ ] Choose app name
- [ ] Tap "Add"
- [ ] App appears on home screen ✅

---

## 🚨 Still Not Working?

### Before Asking for Help, Provide:

1. **What device?** (Android phone, iPhone, iPad, etc.)
2. **What browser?** (Chrome, Safari, Firefox, etc.)
3. **What do you see?** (Nothing? Error? Different prompt?)
4. **DevTools info:**
   - Service Worker status (Active? Offline? Error?)
   - Manifest status (Valid? Missing?)
   - Console errors (Copy any red messages)
5. **Debug bar info:**
   - Device type shown?
   - PWA Support shown as Yes/No?

### Screenshot Help

Take a screenshot showing:
1. The bottom of screen (where prompt should be)
2. DevTools → Application tab → Service Workers
3. DevTools → Console tab (if any errors)

---

## 📱 Testing on Different Devices

### Android Chrome
```
Tested: ✅ Works
Expected: Blue install bar at bottom
```

### Android Firefox
```
Tested: ✅ Works
Expected: Blue install bar at bottom (or may be in menu)
```

### iPhone Safari
```
Tested: ✅ Works (manual only)
Expected: Purple instructions at bottom
Manual steps required
```

### iPad Safari
```
Tested: ✅ Works (manual only)
Expected: Purple instructions at bottom
```

### Samsung Internet
```
Tested: ✅ Works
Expected: Similar to Chrome
```

---

## 🎯 Expected Behavior

### First Visit (Not Installed)
1. Open app on mobile
2. See yellow debug bar at bottom
3. For Android: See blue install bar with "Install" button
4. For iOS: See purple bar with instructions
5. Install the app

### After Installation
1. App appears on home screen
2. Can launch from home screen
3. App runs in standalone mode (no address bar)
4. Debug bar disappears
5. App can work offline

---

## 💡 Tips

- **Always use HTTPS** - PWA requires it
- **Ignore certificate warnings** - Self-signed is fine in development
- **Hard refresh if stuck** - Ctrl+Shift+R clears cache
- **Check WiFi** - Phone and PC must be connected to same network
- **Check IP** - Use actual device IP, not localhost
- **Wait a moment** - Service Worker takes time to register
- **Clear cache** - Old cache can cause issues
- **Restart server** - Restart dev server after config changes

---

## ✅ Success Indicators

When working correctly, you should see:

1. ✅ Yellow debug bar at bottom
2. ✅ Blue (Android) or purple (iOS) install bar
3. ✅ No red errors in console
4. ✅ Service Worker active in DevTools
5. ✅ Manifest loading correctly
6. ✅ Icon appears on home screen after install

---

**Get stuck? Check the debug bar first - it tells you what's happening!**
