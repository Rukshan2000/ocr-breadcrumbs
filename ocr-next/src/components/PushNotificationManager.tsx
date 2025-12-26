'use client';

import { useState, useEffect } from 'react';
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setNotificationPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async function subscribeToPush() {
    try {
      setIsLoading(true);

      // Request notification permission first
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error('VAPID public key is not configured');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);

      alert('Successfully subscribed to push notifications!');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      alert('Failed to subscribe to push notifications. Please check your browser settings.');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    try {
      setIsLoading(true);
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
      alert('Unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      alert('Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    try {
      setIsLoading(true);
      if (subscription && message.trim()) {
        await sendNotification(message);
        setMessage('');
        alert('Notification sent!');
      } else if (!message.trim()) {
        alert('Please enter a message');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          ⚠️ Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">
          ❌ Notification permission has been denied. Please enable notifications in your browser settings to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔔 Push Notifications
      </h3>

      {subscription ? (
        <>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm font-medium">
              ✅ You are subscribed to push notifications
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <input
                type="text"
                placeholder="Enter notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    sendTestNotification();
                  }
                }}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={sendTestNotification}
                disabled={isLoading || !message.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </button>
              <button
                onClick={unsubscribeFromPush}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Unsubscribe'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm font-medium">
              ℹ️ You are not subscribed to push notifications
            </p>
          </div>

          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe to Notifications'}
          </button>

          <p className="mt-3 text-xs text-gray-600">
            💡 Subscribe to receive push notifications about OCR scan updates and other important events.
          </p>
        </>
      )}
    </div>
  );
}
