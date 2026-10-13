import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Web Audio API synthesizer for clean notification sound without external asset dependencies
const playChimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
};

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
      playChimeSound();
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
              playChimeSound();
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

  useEffect(() => {
    fetchNotifications();
    
    // Real-time near-instant polling (every 4 seconds) as backup
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 4000); 
    
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
          if (!isOpen && unreadCount > 0) markAllAsRead();
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
        <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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
