import type { Notification } from '@/types';

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private readonly STORAGE_KEY = 'app_notifications';

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.notifications = JSON.parse(saved);
    }
  }

  private saveNotifications() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  addNotification(
    type: Notification['type'],
    title: string,
    message: string
  ): Notification {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(notification);
    
    // Zadrži samo poslednjih 100 notifikacija
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Browser notification ako je dozvoljeno
    this.showBrowserNotification(title, message);

    return notification;
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  private async showBrowserNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  async requestBrowserPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Prečice za česte notifikacije
  success(title: string, message: string): Notification {
    return this.addNotification('success', title, message);
  }

  info(title: string, message: string): Notification {
    return this.addNotification('info', title, message);
  }

  warning(title: string, message: string): Notification {
    return this.addNotification('warning', title, message);
  }

  error(title: string, message: string): Notification {
    return this.addNotification('error', title, message);
  }
}

export const notificationService = new NotificationService();
