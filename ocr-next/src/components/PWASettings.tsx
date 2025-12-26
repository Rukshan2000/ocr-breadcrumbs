'use client';

import React, { useState } from 'react';
import { PushNotificationManager } from './PushNotificationManager';

/**
 * PWASettings Component
 * 
 * A modal/drawer component for PWA-related settings.
 * Can be integrated into your main app to show:
 * - Push notification management
 * - App info and status
 * - Installation instructions
 */
export function PWASettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'info'>('notifications');

  const isServiceWorkerActive = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const isPushSupported = typeof window !== 'undefined' && 'PushManager' in window;
  const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  return (
    <>
      {/* Floating Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors hover:shadow-xl"
        title="PWA Settings"
        aria-label="Open PWA Settings"
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

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">PWA Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-600 rounded-lg transition-colors"
                aria-label="Close settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 flex">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ℹ️ Info
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {activeTab === 'notifications' && (
                <div className="p-4">
                  <PushNotificationManager />
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-4 space-y-6">
                  {/* Status Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      System Status
                    </h3>
                    <div className="space-y-2">
                      <StatusItem
                        label="Service Worker"
                        status={isServiceWorkerActive}
                      />
                      <StatusItem
                        label="Push Notifications"
                        status={isPushSupported}
                      />
                      <StatusItem
                        label="App Installed"
                        status={isStandalone}
                      />
                      <StatusItem
                        label="HTTPS"
                        status={typeof window !== 'undefined' && window.location.protocol === 'https:'}
                      />
                    </div>
                  </div>

                  {/* Installation Guide */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-blue-900 mb-2">
                      📲 How to Install
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span>📱</span>
                        <span>
                          <strong>Android:</strong> Tap the install prompt or use browser menu
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>🍎</span>
                        <span>
                          <strong>iOS:</strong> Tap Share → Add to Home Screen
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>💻</span>
                        <span>
                          <strong>Desktop:</strong> Look for install icon in address bar
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      ✨ Features
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>✅ Works offline with cached data</li>
                      <li>✅ Install as a native-like app</li>
                      <li>✅ Receive push notifications</li>
                      <li>✅ Fast loading and performance</li>
                      <li>✅ Home screen shortcut</li>
                    </ul>
                  </div>

                  {/* About */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                      About OCR Scanner
                    </h4>
                    <dl className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <dt>Version:</dt>
                        <dd className="font-medium">1.0.0</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Type:</dt>
                        <dd className="font-medium">Progressive Web App</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Mode:</dt>
                        <dd className="font-medium">
                          {isStandalone ? 'Standalone' : 'Browser'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Helper component to display status items
 */
function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
      <span className="text-xs text-gray-700 font-medium">{label}</span>
      <span className={`text-xs font-semibold ${status ? 'text-green-600' : 'text-red-600'}`}>
        {status ? '✅ Active' : '❌ Inactive'}
      </span>
    </div>
  );
}
