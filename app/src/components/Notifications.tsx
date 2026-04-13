import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  Trash2,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { notificationService } from '@/services/notifications';
import type { Notification } from '@/types';

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  success: 'text-green-400 bg-green-500/10',
  info: 'text-blue-400 bg-blue-500/10',
  warning: 'text-yellow-400 bg-yellow-500/10',
  error: 'text-red-400 bg-red-500/10',
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadCount(notificationService.getUnreadCount());
    });
    return unsubscribe;
  }, []);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestBrowserPermission();
    if (granted) {
      notificationService.success('Notifikacije omogućene', 'Dobićeš obaveštenja čak i kada si na drugoj stranici');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-5 h-5 text-zinc-400" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-green-500 text-black text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-zinc-900 border-zinc-800" align="end">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-semibold">Notifikacije</h3>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={requestPermission}
              className="text-zinc-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
            {notifications.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllAsRead}
                  className="text-zinc-400 hover:text-white"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearAll}
                  className="text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Nema notifikacija</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-zinc-800/50 transition-colors ${
                      !notification.read ? 'bg-zinc-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorMap[notification.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-zinc-400 text-sm mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-zinc-500 text-xs mt-1">
                          {new Date(notification.timestamp).toLocaleString('sr-RS')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-zinc-500 hover:text-red-400"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
