'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell({ apiKey }: { apiKey: string | null }) {
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission,
  } = useNotifications(apiKey);

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection Status */}
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <button
              onClick={requestBrowserPermission}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Enable browser notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
