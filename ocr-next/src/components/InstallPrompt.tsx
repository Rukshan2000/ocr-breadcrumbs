'use client';

import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

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
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // If we have the beforeinstallprompt event, use it
      try {
        (deferredPrompt as any).prompt();
        await (deferredPrompt as any).userChoice;
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    } else {
      // Fallback: Show installation instructions
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
          setShowPrompt(false);
        } else {
          // Fallback: Direct installation message
          alert('To install this app:\n\n📱 Android/Chrome:\n1. Tap the menu (three dots)\n2. Tap "Install app"\n\n📲 iOS:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n\n💻 Desktop:\n1. Look for the install icon in address bar\n2. Or use the browser menu');
        }
      } catch (error) {
        alert('To install this app:\n\n1. Look for the install icon in your browser address bar\n2. Or tap the menu and select "Install app" / "Add to Home Screen"');
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Prompt disabled
  return null;
}
