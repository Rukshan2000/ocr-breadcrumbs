'use client';

import dynamic from 'next/dynamic';
import { InstallPrompt } from '@/components/InstallPrompt';
import { PushNotificationManager } from '@/components/PushNotificationManager';

// Dynamic import to avoid SSR issues with camera/canvas
const OCRScanner = dynamic(() => import('@/components/OCRScanner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-white text-lg">Loading OCR Scanner...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <OCRScanner />
      
      {/* Install Prompt - appears at bottom on Android/iOS */}
      <InstallPrompt />
      
      {/* PWA Settings Modal - can be toggled from main app */}
      <PWASettings />
    </>
  );
}

/**
 * PWA Settings component - shows push notification options
 * Can be integrated into a settings menu or shown in a modal
 */
function PWASettings() {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <>
      {/* Settings button - positioned at top right */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-4 z-40 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        title="PWA Settings"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">PWA Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* About Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  About This App
                </h3>
                <p className="text-sm text-gray-600">
                  OCR Scanner is a Progressive Web App that allows you to scan and extract text from images using Tesseract.js.
                </p>
              </div>

              {/* Push Notifications Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Notifications
                </h3>
                <PushNotificationManager />
              </div>

              {/* Installation Instructions */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">
                  📲 Install Instructions
                </h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Android:</strong> Tap the install button or use the menu
                  </li>
                  <li>
                    <strong>iOS:</strong> Share {'>'} Add to Home Screen
                  </li>
                  <li>
                    <strong>Desktop:</strong> Use the menu for install options
                  </li>
                </ul>
              </div>

              {/* App Information */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <h4 className="text-xs font-semibold text-gray-900 mb-2">
                  App Information
                </h4>
                <dl className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <dt>Version:</dt>
                    <dd>1.0.0</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Service Worker:</dt>
                    <dd>
                      {'serviceWorker' in navigator ? '✅ Active' : '❌ Inactive'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Push Support:</dt>
                    <dd>{'PushManager' in window ? '✅ Supported' : '❌ Not supported'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add React import at the top level
import React from 'react';
