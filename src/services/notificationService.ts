// Push Notification Service

// Base-path aware icon URL (works under GitHub Pages subpath deployments).
const ICON = `${import.meta.env.BASE_URL}icon-192.png`;

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async init() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    this.permission = Notification.permission;

    // Get service worker registration
    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Service worker not ready:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        localStorage.setItem('notifications-enabled', 'true');
        return true;
      } else {
        localStorage.setItem('notifications-enabled', 'false');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  hasAskedPermission(): boolean {
    return localStorage.getItem('notifications-enabled') !== null;
  }

  async showNotification(title: string, options: NotificationOptions = {}) {
    if (!this.isEnabled()) {
      console.log('Notifications not enabled');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: ICON,
      badge: ICON,
      tag: 'ecoscan-notification',
      requireInteraction: false,
      ...options,
    };

    try {
      if (this.registration) {
        await this.registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async notifyBadgeUnlocked(badgeName: string, badgeDescription: string) {
    await this.showNotification('New Badge Unlocked!', {
      body: `${badgeName}: ${badgeDescription}`,
      icon: ICON,
      tag: 'badge-unlock',
      data: {
        type: 'badge-unlock',
        badgeName,
      },
    });
  }

  async notifyMilestone(milestone: string, points: number) {
    await this.showNotification('Milestone Reached!', {
      body: `${milestone} - ${points} total points earned!`,
      icon: ICON,
      tag: 'milestone',
      data: {
        type: 'milestone',
        points,
      },
    });
  }

  async notifyStreakAchievement(days: number) {
    await this.showNotification('Streak Achievement!', {
      body: `Amazing! You've maintained a ${days}-day recycling streak!`,
      icon: ICON,
      tag: 'streak',
      data: {
        type: 'streak',
        days,
      },
    });
  }
}

export const notificationService = new NotificationService();
