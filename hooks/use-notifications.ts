import { useState, useMemo } from 'react';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'gig' | 'trust' | 'wallet' | 'system';
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New Gig Match!',
    body: 'A high-paying delivery gig just opened in Ikeja. You qualify with your current Trust Score.',
    type: 'gig',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'Trust Score Boost 🚀',
    body: 'Your Trust Score increased by +15 points after your last gig completion.',
    type: 'trust',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read: false,
  },
  {
    id: '3',
    title: 'Payment Received',
    body: 'You received ₦12,500 from Lagos Logistics for "Order #8822".',
    type: 'wallet',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: '4',
    title: 'Identity Verified',
    body: 'Your BVN verification was successful. You now have Tier 1 access.',
    type: 'system',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    read: true,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
  [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    loading: false 
  };
}
