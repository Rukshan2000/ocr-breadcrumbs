'use server';

// Type definition for push subscription
interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory storage for subscriptions (for demo purposes)
// In production, use a database like PostgreSQL, MongoDB, etc.
let subscriptions: PushSubscriptionJSON[] = [];

/**
 * Subscribe a user to push notifications
 * In production, you should store this in a database
 */
export async function subscribeUser(subscription: PushSubscriptionJSON) {
  try {
    // Check if subscription already exists
    const exists = subscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      subscriptions.push(subscription);
      console.log(`New subscription added. Total: ${subscriptions.length}`);
    } else {
      console.log('Subscription already exists');
    }

    return { success: true, message: 'Successfully subscribed' };
  } catch (error) {
    console.error('Error subscribing user:', error);
    return {
      success: false,
      error: 'Failed to subscribe user',
    };
  }
}

/**
 * Unsubscribe a user from push notifications
 * In production, you should remove this from a database
 */
export async function unsubscribeUser() {
  try {
    // In a real app, you'd remove from database using user ID
    // For now, this is a placeholder
    console.log('User unsubscribed');
    return { success: true, message: 'Successfully unsubscribed' };
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return {
      success: false,
      error: 'Failed to unsubscribe user',
    };
  }
}

/**
 * Send a push notification to a user
 * Note: web-push package is optional and only needed for server-side push
 * If you want to use this, install web-push: npm install web-push
 * Then uncomment the code below and set VAPID keys in .env
 */
export async function sendNotification(message: string) {
  try {
    // Check if web-push is available
    let webpush: any;
    try {
      webpush = require('web-push');
    } catch {
      console.warn('web-push package not installed. Push notifications require web-push.');
      return {
        success: false,
        error: 'Server push notifications are not configured. Install web-push to enable.',
      };
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.warn('VAPID keys not configured');
      return {
        success: false,
        error: 'VAPID keys are not configured. Please set environment variables.',
      };
    }

    // Set VAPID details
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@example.com',
      publicKey,
      privateKey
    );

    // Send notification to all subscriptions
    const notificationPayload = {
      title: 'OCR Scanner Notification',
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'ocr-notification',
      requireInteraction: false,
    };

    const promises = subscriptions.map((subscription) =>
      webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload)
      ).catch((error: any) => {
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error);
        // Remove failed subscriptions
        subscriptions = subscriptions.filter(
          (sub) => sub.endpoint !== subscription.endpoint
        );
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    console.log(
      `Notification sent to ${successful}/${subscriptions.length} subscribers`
    );

    return {
      success: true,
      message: `Notification sent to ${successful} subscriber(s)`,
      totalSubscribers: subscriptions.length,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: 'Failed to send notification',
    };
  }
}

/**
 * Get all subscriptions (for admin purposes)
 * In production, you should have proper authentication
 */
export async function getSubscriptionsCount() {
  return { count: subscriptions.length };
}
