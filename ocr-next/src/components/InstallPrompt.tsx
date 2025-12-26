'use client';

import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Log that component mounted
  useEffect(() => {
    console.log('🔧 InstallPrompt component mounted');
  }, []);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check for iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosCheck);

    // Check for Android
    const androidCheck = /Android/.test(navigator.userAgent);
    setIsAndroid(androidCheck);

    // Show prompt for Android automatically
    if (androidCheck && !standalone) {
      setShowPrompt(true);
    }

    // Debug info
    const debug = `
Device: ${iosCheck ? 'iOS' : androidCheck ? 'Android' : 'Desktop'}
Standalone: ${standalone}
UserAgent: ${navigator.userAgent}
PWA Support: ${typeof navigator.serviceWorker !== 'undefined' ? 'Yes' : 'No'}
    `.trim();
    setDebugInfo(debug);

    // Handle beforeinstallprompt event for Android
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Log that we're listening
    console.log('Install prompt listener attached');
    console.log('Device info:', { isIOS: iosCheck, isAndroid: androidCheck, standalone });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // If we have the beforeinstallprompt event, use it
      try {
        (deferredPrompt as any).prompt();
        const { outcome } = await (deferredPrompt as any).userChoice;
        console.log(`User response: ${outcome}`);
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    } else {
      // Fallback: Show browser's native install UI
      // On Android, this triggers the system install dialog
      console.log('Using fallback install method...');
      
      // Try to trigger native install through manifest
      const link = document.createElement('a');
      link.href = '/manifest.json';
      link.rel = 'manifest';
      document.head.appendChild(link);
      
      // Show a message to user
      alert('Tap the menu icon (3 dots) and select "Install app" or "Add to Home Screen"');
      
      // Alternative: Try to focus on address bar
      // Some browsers allow direct install from there
      window.location.href = window.location.href;
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show if already installed
  if (isStandalone) {
    console.log('📦 Already installed (standalone mode)');
    return null;
  }

  console.log('📱 Rendering InstallPrompt', { isAndroid, showPrompt, isStandalone });

  return (
    <>
      {/* Android Install Prompt - Show if Android detected (with or without beforeinstallprompt event) */}
      {isAndroid && showPrompt && (
        <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 border-t border-blue-800 p-4 shadow-2xl z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">
                📱 Install OCR Scanner
              </h3>
              <p className="text-blue-100 text-xs">
                Add to your home screen for quick access
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-blue-100 hover:text-white transition-colors font-medium"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-blue-600 text-sm rounded-md hover:bg-blue-50 transition-colors font-bold"
              >
                {deferredPrompt ? 'Install' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Manual Install Instructions */}
      {isIOS && !isStandalone && (
        <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-r from-purple-600 to-purple-700 border-t border-purple-800 p-4 shadow-2xl z-50">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-white font-semibold text-sm mb-3">
              📲 Install OCR Scanner on iOS
            </h3>
            <ol className="text-purple-100 text-xs space-y-2 ml-4 list-decimal">
              <li>Tap the <span className="font-bold">Share</span> button at the bottom</li>
              <li>Scroll down and tap <span className="font-bold">Add to Home Screen</span></li>
              <li>Choose a name for the app</li>
              <li>Tap <span className="font-bold">Add</span> to install</li>
            </ol>
            <button
              onClick={handleDismiss}
              className="mt-3 w-full px-4 py-2 bg-white text-purple-600 text-sm rounded-md hover:bg-purple-50 transition-colors font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Desktop Install Prompt Notification */}
      {!isAndroid && !isIOS && (
        <div className="fixed bottom-20 left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 shadow-lg z-50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-300 text-xs">
              💻 Look for install icon in your browser address bar
            </p>
          </div>
        </div>
      )}
    </>
  );
}
