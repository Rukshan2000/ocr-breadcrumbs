'use client';

import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Log that component mounted
  useEffect(() => {
    console.log('🔧 InstallPrompt component mounted');
  }, []);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Show prompt if not already installed
    if (!standalone) {
      setShowPrompt(true);
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    console.log('Install prompt listener attached');

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
      // Fallback: Attempt to install PWA programmatically
      console.log('Installing PWA programmatically...');
      try {
        // Check if Web App Manifest is loaded
        const manifest = document.querySelector('link[rel="manifest"]');
        if (!manifest) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }

        // Try to use the Web Share API if available
        if (navigator.share) {
          await navigator.share({
            title: 'OCR Scanner',
            text: 'Install OCR Scanner app',
            url: window.location.href,
          });
          console.log('Share dialog opened');
          setShowPrompt(false);
        } else {
          // Fallback: Direct installation message
          alert('To install this app:\n\n📱 Android/Chrome:\n1. Tap the menu (three dots)\n2. Tap "Install app"\n\n📲 iOS:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n\n💻 Desktop:\n1. Look for the install icon in address bar\n2. Or use the browser menu');
        }
      } catch (error) {
        console.error('Error during installation:', error);
        alert('To install this app:\n\n1. Look for the install icon in your browser address bar\n2. Or tap the menu and select "Install app" / "Add to Home Screen"');
      }
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

  console.log('📱 Rendering InstallPrompt', { showPrompt, isStandalone });

  return (
    <>
      {/* Universal Install Prompt */}
      {showPrompt && (
        <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 border-t border-blue-800 p-4 shadow-2xl z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">
                📱 Install OCR Scanner
              </h3>
              <p className="text-blue-100 text-xs">
                Install this app for quick access and offline support
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
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
