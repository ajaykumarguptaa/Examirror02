import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Building2,
  Wallet,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

export interface RealtimeNotificationPayload {
  id?: number | null;
  userType: 'admin' | 'center' | 'student';
  userId?: number | null;
  title: string;
  message: string;
  type: string;
  extraData?: any;
  created_at?: string;
}

interface ToastNotification extends RealtimeNotificationPayload {
  toastId: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  activeNotifications: ToastNotification[];
  dismissToast: (toastId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  activeNotifications: [],
  dismissToast: () => {}
});

export const useRealtime = () => useContext(RealtimeContext);

// Synthesize pleasant, non-intrusive alert chime using native Web Audio API
const playChimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio chime: D5 (587.33Hz) up to A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // Audio context may be restricted by autoplay policy before user gesture
  }
};

interface RealtimeNotificationProviderProps {
  userType: 'admin' | 'center' | 'student';
  userId?: number | null;
  children: React.ReactNode;
}

export const RealtimeNotificationProvider: React.FC<RealtimeNotificationProviderProps> = ({
  userType,
  userId,
  children
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const handleIncomingNotification = useCallback((payload: RealtimeNotificationPayload) => {
    // 1. Play subtle audio chime
    playChimeSound();

    // 2. Add floating toast notification
    const toastId = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = { ...payload, toastId };

    setToasts(prev => [newToast, ...prev].slice(0, 4)); // Keep up to 4 newest toasts

    // Auto-dismiss after 7 seconds
    setTimeout(() => {
      dismissToast(toastId);
    }, 7000);

    // 3. Dispatch specific browser window events for seamless two-way UI sync without refresh
    try {
      window.dispatchEvent(new CustomEvent('realtime-notification', { detail: payload }));
      window.dispatchEvent(new CustomEvent('notifications-updated', { detail: payload }));

      const type = payload.type || '';
      if (type.includes('franchise')) {
        window.dispatchEvent(new CustomEvent('franchise-updated', { detail: payload }));
      }
      if (type.includes('certificate')) {
        window.dispatchEvent(new CustomEvent('certificate-updated', { detail: payload }));
        window.dispatchEvent(new CustomEvent('center-stats-updated', { detail: payload }));
      }
      if (type.includes('wallet')) {
        window.dispatchEvent(new CustomEvent('wallet-updated', { detail: payload }));
        window.dispatchEvent(new CustomEvent('center-stats-updated', { detail: payload }));
      }
      if (type.includes('contact')) {
        window.dispatchEvent(new CustomEvent('contact-updated', { detail: payload }));
      }
    } catch (dispatchErr) {
      console.error('[Realtime] Event dispatch error:', dispatchErr);
    }
  }, [dismissToast]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const streamUrl = `http://localhost:3000/api/notifications/stream?userType=${userType}${userId ? `&userId=${userId}` : ''}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (isSubscribed) {
          setIsConnected(true);
        }
      };

      // Listen for connected greeting
      es.addEventListener('connected', () => {
        if (isSubscribed) setIsConnected(true);
      });

      // Listen for general notification
      es.addEventListener('notification', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (isSubscribed) handleIncomingNotification(data);
        } catch (_) {}
      });

      // Listen for specific domain events
      const specificEvents = [
        'franchise_new',
        'franchise_approved',
        'franchise_rejected',
        'certificate_claimed',
        'certificate_approved',
        'certificate_demanded',
        'certificate_resubmitted',
        'wallet_request',
        'wallet_approved',
        'wallet_rejected',
        'contact_query'
      ];

      specificEvents.forEach((evtName) => {
        es.addEventListener(evtName, (e) => {
          try {
            const data = JSON.parse(e.data);
            if (isSubscribed) handleIncomingNotification(data);
          } catch (_) {}
        });
      });

      es.onerror = () => {
        if (isSubscribed) {
          setIsConnected(false);
          es.close();
          // Attempt automatic reconnect after 4 seconds
          reconnectTimeout = setTimeout(connectSSE, 4000);
        }
      };
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [userType, userId, handleIncomingNotification]);

  const getToastIcon = (type: string = '') => {
    if (type.includes('franchise')) return <Building2 size={18} className="text-amber-500" />;
    if (type.includes('certificate')) return <FileText size={18} className="text-indigo-500" />;
    if (type.includes('wallet')) return <Wallet size={18} className="text-emerald-500" />;
    if (type.includes('warning') || type.includes('demanded')) return <AlertCircle size={18} className="text-rose-500" />;
    return <Sparkles size={18} className="text-indigo-500" />;
  };

  const handleToastAction = (t: ToastNotification) => {
    dismissToast(t.toastId);
    if (userType === 'admin') {
      if (t.type.includes('franchise')) {
        navigate('/admin/franchise-requests');
      } else if (t.type.includes('wallet')) {
        navigate('/admin/wallet-requests');
      } else if (t.type.includes('contact')) {
        navigate('/admin/contact-queries');
      } else if (t.type.includes('certificate')) {
        navigate('/admin/franchise-requests');
      }
    } else if (userType === 'center') {
      if (t.type.includes('wallet')) {
        navigate('/center/wallet');
      } else {
        navigate('/center');
      }
    }
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, activeNotifications: toasts, dismissToast }}>
      {children}

      {/* Floating Modern Real-time Toast Notifications (Top-Right) */}
      <aside aria-label="Notifications" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.toastId}
            className="pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 duration-200 hover:shadow-indigo-500/20"
          >
            {/* Icon Bubble */}
            <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
              {getToastIcon(t.type)}
            </div>

            {/* Notification Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <h4 className="text-xs font-bold text-slate-100 tracking-tight truncate">
                  {t.title}
                </h4>
              </div>

              <div
                className="text-[11.5px] text-slate-300 mt-1 leading-snug line-clamp-2"
                dangerouslySetInnerHTML={{ __html: t.message }}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => handleToastAction(t)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>View Details</span>
                  <ExternalLink size={11} />
                </button>

                <button
                  type="button"
                  onClick={() => dismissToast(t.toastId)}
                  className="text-[10.5px] text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => dismissToast(t.toastId)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </aside>
    </RealtimeContext.Provider>
  );
};

export default RealtimeNotificationProvider;
