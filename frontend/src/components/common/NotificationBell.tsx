import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Volume2, VolumeX, ChevronRight, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

import { playNotificationSound } from '../../context/RealtimeNotificationContext';


interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

interface NotificationBellProps {
  userType: 'admin' | 'center' | 'student';
  userId?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userType, userId }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notification_sound_enabled') !== 'false';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('notification_sound_enabled', String(next));
    if (next) {
      playNotificationSound();
    }
  };

  const fetchNotifications = async (playSound: boolean = false) => {
    try {
      const url = `${API_BASE}/notifications?userType=${userType}${userId ? `&userId=${userId}` : ''}`;
      const res = await axios.get(url);
      if (res.data?.success) {
        const newItems: Notification[] = res.data.data;
        setNotifications(prev => {
          if (playSound && soundEnabled) {
            const hasNewUnread = newItems.some(n => n.is_read === 0 && !prev.some(p => p.id === n.id));
            if (hasNewUnread) {
              playNotificationSound();
            }
          }
          return newItems;
        });
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

  // Determine destination URL intelligently based on notification data
  const getNotificationDestination = (n: Notification): string => {
    if (n.link_url && n.link_url.trim()) {
      return n.link_url.trim();
    }

    const titleLower = (n.title || '').toLowerCase();
    const msgLower = (n.message || '').toLowerCase();
    const typeLower = (n.type || '').toLowerCase();

    // Extract center code if present in the message
    const codeMatch = n.message?.match(/code:\s*<[^>]*>([a-zA-Z0-9_-]+)<[^>]*>/i) || 
                      n.message?.match(/code:\s*([a-zA-Z0-9_-]+)/i);
    const centerCode = codeMatch ? codeMatch[1].trim() : '';

    if (userType === 'admin') {
      if (
        typeLower.includes('certificate') || 
        titleLower.includes('certificate') || 
        titleLower.includes('demanded documents') ||
        msgLower.includes('certificate')
      ) {
        return `/admin/franchise-requests?tab=cert_claims${centerCode ? `&search=${encodeURIComponent(centerCode)}` : ''}`;
      }
      if (typeLower.includes('franchise') || titleLower.includes('franchise') || msgLower.includes('franchise')) {
        return `/admin/franchise-requests${centerCode ? `?search=${encodeURIComponent(centerCode)}` : ''}`;
      }
      if (
        typeLower.includes('wallet') || 
        titleLower.includes('wallet') || 
        titleLower.includes('recharge') || 
        msgLower.includes('wallet') || 
        msgLower.includes('utr')
      ) {
        return '/admin/wallet-requests';
      }
      if (typeLower.includes('contact') || titleLower.includes('contact') || titleLower.includes('inquiry')) {
        return '/admin/contact-queries';
      }
      if (typeLower.includes('student') || titleLower.includes('student')) {
        return '/admin/students';
      }
      if (typeLower.includes('course') || titleLower.includes('course')) {
        return '/admin/courses';
      }
      if (typeLower.includes('test') || titleLower.includes('test')) {
        return '/admin/test-series';
      }
      return '/admin/franchise-requests';
    }

    if (userType === 'center') {
      if (typeLower.includes('certificate') || titleLower.includes('certificate') || titleLower.includes('demanded')) {
        return '/center';
      }
      if (typeLower.includes('wallet') || titleLower.includes('wallet') || titleLower.includes('recharge')) {
        return '/center/wallet';
      }
      if (typeLower.includes('student') || titleLower.includes('student')) {
        return '/center/students';
      }
      if (typeLower.includes('course') || titleLower.includes('course')) {
        return '/center/courses';
      }
      if (typeLower.includes('exam') || titleLower.includes('exam') || typeLower.includes('test')) {
        return '/center/exams';
      }
      return '/center';
    }

    if (userType === 'student') {
      if (typeLower.includes('test') || titleLower.includes('test') || titleLower.includes('series')) {
        return '/student/test-series';
      }
      if (typeLower.includes('note') || titleLower.includes('note') || titleLower.includes('study')) {
        return '/student/notes';
      }
      return '/student/dashboard';
    }

    return '/';
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark this specific notification as read in UI & backend
    if (n.is_read === 0) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
      try {
        await axios.patch(`${API_BASE}/notifications/${n.id}/read`);
      } catch (_) {}
    }

    // 2. Close notification dropdown
    setIsOpen(false);

    // 3. Navigate to target destination
    const destination = getNotificationDestination(n);
    if (destination) {
      if (destination.startsWith('http')) {
        window.location.href = destination;
      } else {
        navigate(destination);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Fallback heartbeat (every 60s) while SSE push events deliver instant updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 60000); 
    
    // Immediate reactive sync on realtime SSE push events without waiting for poll
    const handleRealtimeUpdate = () => {
      fetchNotifications(true);
    };
    window.addEventListener('notifications-updated', handleRealtimeUpdate);
    window.addEventListener('realtime-notification', handleRealtimeUpdate);

    // Add visibility change listener to fetch immediately when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleRealtimeUpdate);
      window.removeEventListener('realtime-notification', handleRealtimeUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userType, userId, soundEnabled]);

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
        }}
        className={`relative w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
          unreadCount > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
        }`}
        title={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={16} className={unreadCount > 0 ? 'animate-pulse text-indigo-600' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[9.5px] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              Notifications {unreadCount > 0 && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">{unreadCount} New</span>}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={toggleSound}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                title={soundEnabled ? 'Notification Sound: ON (Click to mute)' : 'Notification Sound: MUTED (Click to unmute)'}
              >
                {soundEnabled ? <Volume2 size={13} className="text-emerald-600" /> : <VolumeX size={13} className="text-gray-400" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} /> Mark all read
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition-all cursor-pointer group hover:bg-indigo-50/70 active:bg-indigo-100/60 ${
                    n.is_read === 0 ? 'bg-indigo-50/40' : 'bg-white'
                  }`}
                  title="Click to view and open"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                      n.is_read === 0 ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className={`text-xs font-bold truncate ${n.is_read === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </h4>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div 
                        className="text-[11px] text-gray-500 mt-1 leading-relaxed prose-sm max-w-none line-clamp-2 prose-p:my-0.5 prose-a:text-indigo-600 prose-strong:font-bold prose-strong:text-gray-700" 
                        dangerouslySetInnerHTML={{ __html: n.message }} 
                      />
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100/70 text-[9.5px]">
                        <span className="text-gray-400 font-medium">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          View Details <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
