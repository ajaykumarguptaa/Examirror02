import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BookOpen, FileText, CheckCircle2, Lock, ArrowLeft, Maximize2, X, AlertTriangle } from 'lucide-react';

export default function StudyMaterialPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isScreenCaptured, setIsScreenCaptured] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(`/api/study-materials/${id}`).catch(() => axios.get(`http://localhost:3000/api/study-materials/${id}`));
        if (res.data.success) {
          const noteData = res.data.data;
          setNote(noteData);

          // Start analytics session
          try {
            const analyticsRes = await axios.post(`http://localhost:3000/api/study-materials/analytics/${id}/start`, {
              viewType: Number(noteData.price) === 0 ? 'FULL' : 'DEMO'
            });
            if (analyticsRes.data.success) {
              setSessionToken(analyticsRes.data.sessionToken);
            }
          } catch (err) {
            console.error('Failed to start analytics', err);
          }
        } else {
          navigate('/notes');
        }
      } catch (err) {
        console.error(err);
        navigate('/notes');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  // Usage Analytics Ping
  useEffect(() => {
    if (!sessionToken) return;

    const interval = setInterval(() => {
      axios.post('http://localhost:3000/api/study-materials/analytics/ping', {
        sessionToken,
        seconds: 10
      }).catch(err => console.error('Analytics ping failed', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  // Anti-piracy screenshot & copy keyboard blocker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Print (Ctrl+P, Cmd+P), Save (Ctrl+S, Cmd+S), Source (Ctrl+U), PrintScreen
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault();
        setIsScreenCaptured(true);
        setTimeout(() => setIsScreenCaptured(false), 2500);
      }
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsScreenCaptured(true);
        setTimeout(() => setIsScreenCaptured(false), 2500);
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <Helmet>
        <title>{note.title} | Examirror Study Materials</title>
        <meta name="description" content={note.description || `Get ${note.title} for your exam preparation. Secure e-note available at Examirror Academy.`} />
        <meta property="og:title" content={`${note.title} | Examirror`} />
        <meta property="og:description" content={note.description || `Secure e-note available for ${note.category || 'preparation'}.`} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/notes" className="inline-flex items-center gap-2 text-indigo-600 font-semibold mb-8 hover:text-indigo-700 transition-colors">
          <ArrowLeft size={18} /> Back to Library
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-indigo-950 p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              {note.file_type === 'HTML' ? <FileText size={200} /> : <BookOpen size={200} />}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wide border border-indigo-500/30">
                  {note.file_type === 'HTML' ? 'Interactive HTML Note' : 'Secure PDF Note'}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wide border border-slate-700">
                  {note.category || 'General'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {note.title}
              </h1>
              <p className="text-indigo-200 text-lg max-w-2xl leading-relaxed">
                {note.description || 'Comprehensive study material designed for optimal preparation.'}
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12 flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">What's included</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                    <span>Instant access after enrollment</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                    <span>Examirror Secure DRM Protection</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                    <span>Optimized for desktop and mobile reading</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                    <span>{note.file_size || 'Standard file size'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">About the Material</h3>
                <div className="prose prose-slate prose-indigo">
                  <p>
                    This secure digital note is provided by Examirror Academy. To protect intellectual property,
                    this document is heavily encrypted and dynamically watermarked with your candidate details.
                    It can only be viewed within our secure proprietary reader.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 shrink-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sticky top-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Enrollment Fee</div>
                  <div className="text-4xl font-black text-slate-900">
                    {Number(note.price) > 0 ? `₹${note.price}` : 'FREE'}
                  </div>
                </div>

                <Link
                  to="/login/student"
                  className="w-full block text-center py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all mb-4"
                >
                  Log In to Access — Coming Soon for Students Not Enrolled in a Center.
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <Lock size={14} /> Secure Access via Portal
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Preview Section */}
          {note.demo_content && (
            <div className="p-8 sm:p-12 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={28} />
                  {Number(note.price) === 0 ? 'Full Note Viewer' : 'Note Preview'}
                </h3>

                {Number(note.price) === 0 && (
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    <Maximize2 size={18} /> Open Full Screen
                  </button>
                )}
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5">
                {/* Sandboxed iframe for HTML demo/full view */}
                <iframe
                  title="Demo Content"
                  sandbox="allow-same-origin allow-scripts"
                  srcDoc={note.demo_content}
                  className={`w-full border-none bg-white ${Number(note.price) === 0
                    ? 'h-[800px]'
                    : 'h-[500px] pointer-events-none select-none'
                    }`}
                />

                {/* Fade out gradient and CTA overlay ONLY for paid notes */}
                {Number(note.price) > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-10 pointer-events-auto">
                    <div className="bg-white/80 backdrop-blur-xl px-8 py-6 rounded-2xl border border-slate-200 shadow-2xl text-center transform transition-transform hover:scale-105">
                      <p className="text-slate-900 font-extrabold text-lg mb-4">Unlock the full material to keep reading.</p>
                      <Link
                        to="/login/student"
                        className="inline-block bg-indigo-600 text-white font-bold text-lg py-3 px-10 rounded-xl hover:bg-indigo-700 transition-all shadow-indigo-600/30 shadow-lg"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Reader Modal for Free Notes */}
      {isFullScreen && Number(note.price) === 0 && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col">
          <div className="h-14 bg-slate-950 flex items-center justify-between px-6 border-b border-slate-800 shadow-xl shrink-0">
            <div className="flex items-center gap-3 text-white">
              <BookOpen className="text-indigo-400" size={20} />
              <span className="font-semibold text-sm truncate max-w-md">{note.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                FREE PUBLIC ACCESS
              </span>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 bg-white overflow-hidden relative">
            <iframe
              title="Full Content"
              sandbox="allow-same-origin allow-scripts"
              srcDoc={note.demo_content}
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>
      )}

      {/* Screen Capture Warning Overlay */}
      {isScreenCaptured && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-xl">
          <AlertTriangle className="text-red-500 mb-6" size={80} />
          <h2 className="text-4xl font-black mb-4">Security Alert</h2>
          <p className="text-xl text-slate-300 max-w-lg mb-8 leading-relaxed">
            Screenshots, printing, and copying are strictly prohibited for secure study materials.
          </p>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Examirror Content Protection System
          </div>
        </div>
      )}
    </div>
  );
}
