
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, X, Trash2, BarChart3 } from 'lucide-react';
import { endpoints, getApiBase } from '../api/client';

type UiNotification = {
    id: number;
    title: string;
    detail?: string | null;
    level: string;
    created_at?: string | null;
};

const formatAgo = (iso?: string | null) => {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    if (!Number.isFinite(ts)) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
};

const mapLevel = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l === 'success') return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Success' };
    if (l === 'warning') return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Warning' };
    if (l === 'error') return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', label: 'Error' };
    return { icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700', label: 'Info' };
};

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<UiNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        endpoints
            .getNotifications(100)
            .then((res) => { if (!cancelled) setNotifications(res || []); })
            .catch(() => { if (!cancelled) setNotifications([]); })
            .finally(() => { if (!cancelled) setLoading(false); });

        // Real-time updates via WebSocket
        try {
            const wsUrl = getApiBase().replace('http', 'ws') + '/ws/notifications';
            const ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg?.type === 'notification' && msg?.data?.id) {
                        setNotifications((prev) => {
                            const next = [msg.data as UiNotification, ...prev.filter((n) => n.id !== msg.data.id)];
                            return next.slice(0, 100);
                        });
                    }
                    if (msg?.type === 'notification_cleared' && msg?.id) {
                        setNotifications((prev) => prev.filter((n) => n.id !== Number(msg.id)));
                    }
                } catch { /* ignore */ }
            };
            wsRef.current = ws;
        } catch { /* ignore ws errors */ }

        return () => {
            cancelled = true;
            try { wsRef.current?.close(); } catch { /* ignore */ }
            wsRef.current = null;
        };
    }, []);

    const handleDismiss = async (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try { await endpoints.clearNotification(id); } catch { /* ignore */ }
    };

    const handleClearAll = async () => {
        try {
            await endpoints.clearNotifications();
            setNotifications([]);
        } catch { /* ignore */ }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {loading ? 'Loading…' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
                        <Bell size={36} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">All caught up!</h3>
                    <p className="text-slate-400 dark:text-slate-500 font-medium">No notifications to show right now.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {notifications.map((n) => {
                        const m = mapLevel(n.level);
                        const Icon = m.icon;
                        return (
                            <div
                                key={n.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex gap-4 items-start hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                            >
                                <div className={`shrink-0 w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center ${m.color}`}>
                                    <Icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{n.title}</p>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.badge}`}>
                                            {m.label}
                                        </span>
                                    </div>
                                    {n.detail && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{n.detail}</p>
                                    )}
                                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                        <Clock size={12} />
                                        {formatAgo(n.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(n.id)}
                                    className="shrink-0 w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    title="Dismiss"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
