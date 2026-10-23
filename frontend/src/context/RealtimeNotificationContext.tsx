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
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface RealtimeNotificationPayload {
  id?: number | null;
  userType: 'admin' | 'center' | 'student';
  userId?: number | null;
  title: string;
  message: string;
  type: string;
  link_url?: string | null;
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
  playNotificationSound: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  activeNotifications: [],
  dismissToast: () => {},
  playNotificationSound: () => {}
});

export const useRealtime = () => useContext(RealtimeContext);

// --- SHARED AUDIO CONTEXT & PLEASANT TWO-TONE CHIME ---
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Auto-unlock audio context on user interaction anywhere on the document
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

export const playNotificationSound = () => {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('notification_sound_enabled') === 'false') {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Voice 1: Crisp primary bell chime (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Voice 2: Harmonic sparkle chime (1318.5 Hz - E6) with slight delay (+0.08s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);
    gain2.gain.setValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);

    // Voice 3: Warm fundamental root (440 Hz - A4)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(440, now);
    gain3.gain.setValueAtTime(0.18, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.5);
  } catch (err) {
    console.warn('[Audio] Could not play notification chime:', err);
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
  const recentDedupeKeysRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const handleIncomingNotification = useCallback((payload: RealtimeNotificationPayload) => {
    // 0. Deduplicate duplicate events received within 2.5 seconds
    const dedupeKey = `${payload.id || ''}_${payload.type}_${payload.title}`;
    const now = Date.now();
    const lastSeen = recentDedupeKeysRef.current.get(dedupeKey);
    if (lastSeen && now - lastSeen < 2500) {
      return; // Ignore duplicate
    }
    recentDedupeKeysRef.current.set(dedupeKey, now);

    // Clean up old dedupe keys
    if (recentDedupeKeysRef.current.size > 50) {
      recentDedupeKeysRef.current.forEach((val, k) => {
        if (now - val > 10000) recentDedupeKeysRef.current.delete(k);
      });
    }

    // 1. Play real-time notification audio chime
    playNotificationSound();

    // 2. Add floating top-middle pop-up notification
    const toastId = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = { ...payload, toastId };

    // Display newest toast at top, keep max 3 concurrent
    setToasts(prev => [newToast, ...prev].slice(0, 3));

    // Auto-dismiss after 6.5 seconds
    setTimeout(() => {
      dismissToast(toastId);
    }, 6500);

    // 3. Dispatch browser window events for instant synchronization across views
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
    if (type.includes('certificate')) return <FileText size={20} className="text-amber-400" />;
    if (type.includes('franchise')) return <Building2 size={20} className="text-indigo-400" />;
    if (type.includes('wallet')) return <Wallet size={20} className="text-emerald-400" />;
    if (type.includes('warning') || type.includes('demanded')) return <AlertCircle size={20} className="text-rose-400" />;
    return <Bell size={20} className="text-amber-400 animate-pulse" />;
  };

  const handleToastAction = (t: ToastNotification) => {
    dismissToast(t.toastId);

    // 1. Explicit link URL
    if (t.link_url && t.link_url.trim()) {
      const dest = t.link_url.trim();
      if (dest.startsWith('http')) {
        window.location.href = dest;
      } else {
        navigate(dest);
      }
      return;
    }

    // 2. Intelligent destination routing
    const titleLower = (t.title || '').toLowerCase();
    const msgLower = (t.message || '').toLowerCase();
    const typeLower = (t.type || '').toLowerCase();

    // Extract center code if present in message
    const codeMatch = t.message?.match(/code:\s*<[^>]*>([a-zA-Z0-9_-]+)<[^>]*>/i) || 
                      t.message?.match(/code:\s*([a-zA-Z0-9_-]+)/i);
    const centerCode = codeMatch ? codeMatch[1].trim() : '';

    if (userType === 'admin') {
      if (
        typeLower.includes('certificate') || 
        titleLower.includes('certificate') || 
        titleLower.includes('demanded documents') ||
        msgLower.includes('certificate')
      ) {
        navigate(`/admin/franchise-requests?tab=cert_claims${centerCode ? `&search=${encodeURIComponent(centerCode)}` : ''}`);
        return;
      }
      if (typeLower.includes('franchise') || titleLower.includes('franchise') || msgLower.includes('franchise')) {
        navigate(`/admin/franchise-requests${centerCode ? `?search=${encodeURIComponent(centerCode)}` : ''}`);
        return;
      }
      if (typeLower.includes('wallet') || titleLower.includes('wallet') || titleLower.includes('recharge')) {
        navigate('/admin/wallet-requests');
        return;
      }
      if (typeLower.includes('contact') || titleLower.includes('contact') || titleLower.includes('inquiry')) {
        navigate('/admin/contact-queries');
        return;
      }
      if (typeLower.includes('student') || titleLower.includes('student')) {
        navigate('/admin/students');
        return;
      }
      navigate('/admin/franchise-requests');
      return;
    }

    if (userType === 'center') {
      if (typeLower.includes('certificate') || titleLower.includes('certificate') || titleLower.includes('demanded')) {
        navigate('/center');
        return;
      }
      if (typeLower.includes('wallet') || titleLower.includes('wallet') || titleLower.includes('recharge')) {
        navigate('/center/wallet');
        return;
      }
      if (typeLower.includes('student') || titleLower.includes('student')) {
        navigate('/center/students');
        return;
      }
      if (typeLower.includes('course') || titleLower.includes('course')) {
        navigate('/center/courses');
        return;
      }
      navigate('/center');
      return;
    }

    if (userType === 'student') {
      if (typeLower.includes('test') || titleLower.includes('test') || titleLower.includes('series')) {
        navigate('/student/test-series');
        return;
      }
      if (typeLower.includes('note') || titleLower.includes('note')) {
        navigate('/student/notes');
        return;
      }
      navigate('/student/dashboard');
      return;
    }
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, activeNotifications: toasts, dismissToast, playNotificationSound }}>
      {children}

      {/* Floating Modern Real-time Pop-up (Top-Middle Center Dropdown Animation) */}
      <aside 
        aria-label="Real-time Notifications" 
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-3 w-[92vw] max-w-lg pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.toastId}
            onClick={() => handleToastAction(t)}
            className="pointer-events-auto w-full bg-[#0a0f1d]/95 hover:bg-[#0f172a] text-white backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(99,102,241,0.3)] border border-indigo-500/40 hover:border-indigo-400 flex items-start gap-3.5 transition-all transform animate-in fade-in slide-in-from-top-8 duration-300 cursor-pointer group"
          >
            {/* Left Accent & Icon Bubble */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform mt-0.5">
              {getToastIcon(t.type)}
            </div>

            {/* Notification Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 shrink-0">
                    Live Notification
                  </span>
                  <span className="text-slate-500">•</span>
                  <h4 className="text-xs font-bold text-slate-100 tracking-tight truncate">
                    {t.title}
                  </h4>
                </div>
                <span className="text-[10.5px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                  Open <ArrowRight size={11} />
                </span>
              </div>

              <div
                className="text-[11.5px] text-slate-300 mt-1 leading-snug line-clamp-2 prose-sm prose-p:my-0 prose-strong:text-amber-300"
                dangerouslySetInnerHTML={{ __html: t.message }}
              />

              {/* Action Strip */}
              <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-medium">
                  Click pop-up to open directly
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToastAction(t);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>View Details</span>
                    <ExternalLink size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissToast(t.toastId);
                    }}
                    className="text-[10.5px] text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(t.toastId);
              }}
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
