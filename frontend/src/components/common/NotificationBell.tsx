import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

interface NotificationBellProps {
  userType: 'admin' | 'center' | 'student';
  userId?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userType, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const url = `${API_BASE}/notifications?userType=${userType}${userId ? `&userId=${userId}` : ''}`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(`${API_BASE}/notifications/mark-read`, { userType, userId });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Real-time near-instant polling (every 3 seconds) for announcements without refresh
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 3000); 
    
    // Add visibility change listener to fetch immediately when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userType, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors border cursor-pointer ${
          unreadCount > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <Bell size={16} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              Notifications {unreadCount > 0 && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] rounded-full">{unreadCount} New</span>}
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check size={12} /> Mark all read
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs font-medium">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 transition-colors ${n.is_read === 0 ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Bell size={14} />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${n.is_read === 0 ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                        <div 
                          className="text-[11px] text-gray-500 mt-1 leading-relaxed prose-sm max-w-none prose-p:my-1 prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-strong:font-bold prose-strong:text-gray-700" 
                          dangerouslySetInnerHTML={{ __html: n.message }} 
                        />
                        <p className="text-[9px] text-gray-400 font-medium mt-2">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
