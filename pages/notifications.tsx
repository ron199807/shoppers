import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getNotifications, markNotificationAsRead } from '../lib/api/delivery';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { motion } from 'framer-motion';
import { BellIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const data = await getNotifications(user.id);
      setNotifications(data);
      setLoading(false);
    };
    
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bid_accepted':
        return '🎉';
      case 'bid_rejected':
        return '😢';
      case 'delivery_update':
        return '📦';
      case 'payment_received':
        return '💰';
      case 'rating_received':
        return '⭐';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center space-x-3 mb-8">
            <BellIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          
          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-2">
                You'll be notified when someone accepts your bid or updates a delivery
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${
                    !notification.read ? 'border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}