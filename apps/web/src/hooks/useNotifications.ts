'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export function useNotifications(apiKey: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!apiKey) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:3007/notifications', {
      auth: { apiKey },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification service');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      setConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Notification service ready:', data);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
        });
      }
    });

    newSocket.on('notifications:pending', (data) => {
      console.log('Pending notifications:', data);
      setNotifications(data.notifications);
      setUnreadCount(data.count);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [apiKey]);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && connected) {
      socket.emit('join-room', { roomId }, (response: any) => {
        console.log('Join room response:', response);
      });
    }
  }, [socket, connected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && connected) {
      socket.emit('leave-room', { roomId }, (response: any) => {
        console.log('Leave room response:', response);
      });
    }
  }, [socket, connected]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3007/api/v1/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey!,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [apiKey]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(
        'http://localhost:3007/api/v1/notifications/read-all',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey!,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [apiKey]);

  const requestBrowserPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    socket,
    connected,
    notifications,
    unreadCount,
    joinRoom,
    leaveRoom,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission,
  };
}
