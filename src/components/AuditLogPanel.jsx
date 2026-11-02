import React, { useState, useEffect, useMemo } from 'react';
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Video,
    Copy,
    Check,
    ExternalLink,
    Calendar,
    CheckSquare,
    Code,
    Filter,
    RotateCcw,
    MapPin,
    Users,
    FileText,
} from 'lucide-react';
import { formatIndianDate, formatISTTime } from '../utils/dateUtils';
import { auditApi } from '../api/auditApi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * Extracts the user-friendly action label and secondary task/event title
 * for supported tools, falling back to safe defaults when data is unavailable.
 */
function getActionDisplay(log) {
    const tool = log?.tool;
    const inputArgs = log?.args || log?.inputArgs || {};
    const outputResult = log?.result !== undefined ? log?.result : log?.outputResult;

    if (tool === 'create_task') {
        const rawTitle =
            (typeof inputArgs?.title === 'string' && inputArgs.title.trim())
                ? inputArgs.title.trim()
                : (typeof outputResult?.title === 'string' && outputResult.title.trim())
                    ? outputResult.title.trim()
                    : (typeof outputResult?.task?.title === 'string' && outputResult.task.title.trim())
                        ? outputResult.task.title.trim()
                        : '';

        return {
            primaryLabel: 'Task created',
            secondaryInfo: rawTitle || 'Task details unavailable',
            hasSecondary: true,
            actionKey: 'create_task',
            category: 'tasks',
        };
    }

    if (tool === 'create_calendar_event') {
        const rawTitle =
            (typeof outputResult?.summary === 'string' && outputResult.summary.trim())
                ? outputResult.summary.trim()
                : (typeof outputResult?.title === 'string' && outputResult.title.trim())
                    ? outputResult.title.trim()
                    : (typeof inputArgs?.summary === 'string' && inputArgs.summary.trim())
                        ? inputArgs.summary.trim()
                        : (typeof inputArgs?.title === 'string' && inputArgs.title.trim())
                            ? inputArgs.title.trim()
                            : '';

        return {
            primaryLabel: 'Calendar event created',
            secondaryInfo: rawTitle || 'Task details unavailable',
            hasSecondary: true,
            actionKey: 'create_calendar_event',
            category: 'calendar',
        };
    }

    if (tool === 'complete_task') {
        const rawTitle =
            (typeof outputResult?.title === 'string' && outputResult.title.trim())
                ? outputResult.title.trim()
                : (typeof outputResult?.task?.title === 'string' && outputResult.task.title.trim())
                    ? outputResult.task.title.trim()
                    : (typeof inputArgs?.title === 'string' && inputArgs.title.trim())
                        ? inputArgs.title.trim()
                        : '';

        return {
            primaryLabel: 'Task completed',
            secondaryInfo: rawTitle || 'Task details unavailable',
            hasSecondary: true,
            actionKey: 'complete_task',
            category: 'tasks',
        };
    }

    if (tool === 'check_calendar_availability') {
        const rawDate = inputArgs?.startDate || inputArgs?.date || inputArgs?.timeMin;
        let secondary = '';
        if (rawDate) {
            try {
                secondary = formatIndianDate(rawDate, 'full') || String(rawDate);
            } catch {
                secondary = String(rawDate);
            }
        }
        return {
            primaryLabel: 'Calendar availability checked',
            secondaryInfo: secondary || null,
            hasSecondary: Boolean(secondary),
            actionKey: 'check_calendar_availability',
            category: 'calendar',
        };
    }

    // Default fallback for other tools (e.g. list_tasks)
    return {
        primaryLabel: tool ? tool.replace(/_/g, ' ') : 'Action recorded',
        secondaryInfo: null,
        hasSecondary: false,
        actionKey: tool || 'unknown',
        category: (tool && tool.includes('calendar')) ? 'calendar' : (tool && tool.includes('task')) ? 'tasks' : 'other',
    };
}

/**
 * Validates and extracts a legitimate Google Meet URL.
 * Only returns a URL if it explicitly starts with https://meet.google.com/ or http://meet.google.com/.
 * Never fabricates or guesses URLs.
 */
function extractMeetUrl(log) {
    const result = log?.result !== undefined ? log?.result : log?.outputResult;
    const args = log?.args || log?.inputArgs;

    const candidates = [
        result?.hangoutLink,
        result?.meetingLink,
        result?.meetUrl,
        result?.link,
        args?.meetingLink,
        args?.meetUrl,
    ];

    for (const c of candidates) {
        if (typeof c === 'string') {
            const trimmed = c.trim();
            if (trimmed.startsWith('https://meet.google.com/') || trimmed.startsWith('http://meet.google.com/')) {
                return trimmed;
            }
        }
    }
    return null;
}

/**
 * Extracts available task or calendar event ID for technical inspection.
 */
function extractEntityId(log) {
    const result = log?.result !== undefined ? log?.result : log?.outputResult;
    const args = log?.args || log?.inputArgs;
    return (
        result?.eventId ||
        result?.id ||
        result?._id ||
        result?.taskId ||
        result?.task?._id ||
        result?.task?.id ||
        args?.taskId ||
        args?.id ||
        null
    );
}

/**
 * Extracts error details if an action failed.
 */
function extractErrorDetails(log) {
    const result = log?.result !== undefined ? log?.result : log?.outputResult;
    if (log?.error) return typeof log.error === 'object' ? JSON.stringify(log.error) : String(log.error);
    if (result?.error) return typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error);
    if (log?.success === false && result?.message) return String(result.message);
    if (log?.status === 'error' || log?.status === 'failed') return 'Action execution reported failure';
    if (result?.cancelled) return 'Action was cancelled or rejected by user';
    return null;
}

/**
 * Priority badge helper
 */
function getPriorityBadge(priority) {
    const p = String(priority || '').toLowerCase();
    if (p === 'high') {
        return { label: 'High', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (p === 'medium') {
        return { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (p === 'low') {
        return { label: 'Low', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: priority || 'Medium', className: 'bg-zinc-50 text-zinc-700 border-zinc-200' };
}

/**
 * Task status badge helper
 */
function getStatusBadge(status, isSuccess) {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') {
        return { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s === 'in_progress') {
        return { label: 'In Progress', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (s === 'pending') {
        return { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (!isSuccess || s === 'failed' || s === 'error') {
        return { label: 'Failed', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: status || (isSuccess ? 'Active' : 'Failed'), className: 'bg-zinc-50 text-zinc-700 border-zinc-200' };
}

/**
 * Formats attendee list or participant entries safely.
 */
function formatParticipants(participants) {
    if (!participants) return [];
    if (Array.isArray(participants)) {
        return participants.map((p) => {
            if (typeof p === 'string') return p;
            if (typeof p === 'object' && p !== null) {
                return p.displayName || p.email || JSON.stringify(p);
            }
            return String(p);
        }).filter(Boolean);
    }
    if (typeof participants === 'string' && participants.trim()) {
        return [participants.trim()];
    }
    return [];
}

/**
 * Renders structured activity details replacing raw JSON.
 */
function ActivityDetails({ log, logKey, copiedMeetId, onCopyMeet }) {
    const tool = log?.tool;
    const inputArgs = log?.args || log?.inputArgs || {};
    const outputResult = log?.result !== undefined ? log?.result : log?.outputResult;
    const isSuccess = log.success !== false && log.status !== 'error' && log.status !== 'failed' && !outputResult?.cancelled;
    const actionDisplay = getActionDisplay(log);

    const formatFullTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const formatted = formatIndianDate(ts, 'short', true);
            return formatted || String(ts);
        } catch { return String(ts); }
    };

    if (tool === 'create_task') {
        const title = actionDisplay.secondaryInfo;
        const rawDueDate = inputArgs?.dueDate || outputResult?.dueDate || outputResult?.task?.dueDate;
        let formattedDue = null;
        if (rawDueDate) {
            try {
                formattedDue = formatIndianDate(rawDueDate, 'short', true) || String(rawDueDate);
            } catch {
                formattedDue = String(rawDueDate);
            }
        }
        const rawPriority = inputArgs?.priority || outputResult?.priority || outputResult?.task?.priority || 'medium';
        const priorityBadge = getPriorityBadge(rawPriority);
        const rawStatus = outputResult?.status || outputResult?.task?.status || (isSuccess ? 'Pending' : 'Failed');
        const statusBadge = getStatusBadge(rawStatus, isSuccess);
        const description = inputArgs?.description || outputResult?.description || outputResult?.task?.description;

        return (
            <div className="bg-white border border-canvas-border rounded-md p-3 space-y-2.5 font-sans">
                <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-600" />
                        Task Activity Details
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusBadge.className}`}>
                        {statusBadge.label}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Task Title</span>
                        <span className="font-medium text-zinc-900">{title}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Priority</span>
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border mt-0.5 ${priorityBadge.className}`}>
                            {priorityBadge.label}
                        </span>
                    </div>
                    {formattedDue && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Due Date</span>
                            <span className="text-zinc-800">{formattedDue}</span>
                        </div>
                    )}
                    {description && (
                        <div className="sm:col-span-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Description</span>
                            <span className="text-zinc-700 text-[11px]">{description}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (tool === 'complete_task') {
        const title = actionDisplay.secondaryInfo;
        const rawStatus = outputResult?.status || (isSuccess ? 'Completed' : 'Failed');
        const statusBadge = getStatusBadge(rawStatus, isSuccess);

        return (
            <div className="bg-white border border-canvas-border rounded-md p-3 space-y-2.5 font-sans">
                <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Task Completion Details
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusBadge.className}`}>
                        {statusBadge.label}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Completed Task Title</span>
                        <span className="font-medium text-zinc-900">{title}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Completion Status</span>
                        <span className="text-emerald-700 font-medium">{statusBadge.label}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Execution Timestamp</span>
                        <span className="text-zinc-800">{formatFullTimestamp(log.timestamp || log.createdAt)}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (tool === 'create_calendar_event') {
        const title = actionDisplay.secondaryInfo;
        const dateStr =
            outputResult?.date ||
            (inputArgs?.startTime ? formatIndianDate(inputArgs.startTime, 'long') : null);
        const timeStr =
            outputResult?.timeIST ||
            (outputResult?.startIST && outputResult?.endIST
                ? `${outputResult.startIST} – ${outputResult.endIST}`
                : inputArgs?.startTime && inputArgs?.endTime
                    ? `${formatISTTime(inputArgs.startTime)} – ${formatISTTime(inputArgs.endTime)}`
                    : null);
        const locationStr = outputResult?.location || inputArgs?.location || null;
        const rawParticipants =
            outputResult?.participants ||
            outputResult?.attendees ||
            inputArgs?.attendees ||
            inputArgs?.participants ||
            [];
        const participants = formatParticipants(rawParticipants);
        const meetUrl = extractMeetUrl(log);

        return (
            <div className="bg-white border border-canvas-border rounded-md p-3 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Calendar Event Details
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {isSuccess ? 'Scheduled' : 'Failed'}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Event Title</span>
                        <span className="font-medium text-zinc-900">{title}</span>
                    </div>
                    {dateStr && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Date</span>
                            <span className="text-zinc-800">{dateStr}</span>
                        </div>
                    )}
                    {timeStr && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Time (IST)</span>
                            <span className="text-zinc-800">{timeStr}</span>
                        </div>
                    )}
                    {locationStr && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Location</span>
                            <span className="text-zinc-800 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                                {locationStr}
                            </span>
                        </div>
                    )}
                    {participants.length > 0 && (
                        <div className="sm:col-span-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Participants</span>
                            <div className="flex flex-wrap gap-1.5">
                                {participants.map((p, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded border border-zinc-200"
                                    >
                                        <Users className="w-3 h-3 text-zinc-400" />
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Google Meet Link Section (Only rendered when valid Meet URL exists) */}
                {meetUrl && (
                    <div className="pt-2 border-t border-canvas-border flex flex-wrap items-center justify-between gap-2 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
                                <Video className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-mono text-emerald-800 font-semibold block">
                                    Google Meet
                                </span>
                                <span className="text-[11px] text-emerald-900 font-mono truncate max-w-xs block">
                                    {meetUrl}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Google Meet</span>
                                <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopyMeet(meetUrl, logKey);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-zinc-100 text-zinc-700 text-xs border border-zinc-300 shadow-sm transition-colors"
                                title="Copy Google Meet Link"
                            >
                                {copiedMeetId === logKey ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 font-medium">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                        <span>Copy Link</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (tool === 'check_calendar_availability') {
        const windowChecked =
            inputArgs?.startDate ||
            inputArgs?.date ||
            (inputArgs?.timeMin && inputArgs?.timeMax
                ? `${formatIndianDate(inputArgs.timeMin, 'short', true)} to ${formatIndianDate(inputArgs.timeMax, 'short', true)}`
                : null);
        const totalEvents =
            outputResult?.totalEvents !== undefined
                ? outputResult.totalEvents
                : outputResult?.events
                    ? outputResult.events.length
                    : null;
        const msg = outputResult?.message || (outputResult?.hasConflicts ? 'Conflicts detected' : 'Time window available');

        return (
            <div className="bg-white border border-canvas-border rounded-md p-3 space-y-2.5 font-sans">
                <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                        Availability Check Details
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-zinc-50 text-zinc-700 border-zinc-200">
                        {isSuccess ? 'Checked' : 'Failed'}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {windowChecked && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Queried Window</span>
                            <span className="text-zinc-800">{windowChecked}</span>
                        </div>
                    )}
                    {totalEvents !== null && (
                        <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Events Found</span>
                            <span className="text-zinc-800 font-mono">{totalEvents}</span>
                        </div>
                    )}
                    {msg && (
                        <div className="sm:col-span-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-mono block">Availability Status</span>
                            <span className="text-zinc-800">{msg}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Fallback for other tools (e.g. list_tasks)
    return (
        <div className="bg-white border border-canvas-border rounded-md p-3 space-y-2 font-sans">
            <div className="flex items-center justify-between border-b border-canvas-border pb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    Activity Details
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-zinc-50 text-zinc-700 border-zinc-200">
                    {isSuccess ? 'Executed' : 'Failed'}
                </span>
            </div>
            <div className="text-xs text-zinc-700">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Action Type</span>
                <span className="font-medium text-zinc-900">{actionDisplay.primaryLabel}</span>
            </div>
            {outputResult?.count !== undefined && (
                <div className="text-xs text-zinc-700">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Items Returned</span>
                    <span className="font-mono text-zinc-900">{outputResult.count}</span>
                </div>
            )}
        </div>
    );
}

export function AuditLogPanel() {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    // Default configuration
    // - Action category: All actions ('all')
    // - Execution status: All statuses ('all')
    // - Specific action: All ('all')
    // - Initially display latest 10 records
    // - All audit entries collapsed by default
    // - Developer details collapsed by default
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'calendar' | 'tasks'
    const [statusFilter, setStatusFilter] = useState('all');     // 'all' | 'successful' | 'failed' | 'pending'
    const [actionFilter, setActionFilter] = useState('all');     // 'all' | 'create_task' | 'complete_task' | 'create_calendar_event' | 'check_calendar_availability'
    const [displayLimit, setDisplayLimit] = useState(10);
    const [expandedId, setExpandedId] = useState(null);
    const [expandedDevIds, setExpandedDevIds] = useState(new Set());
    const [copiedMeetId, setCopiedMeetId] = useState(null);

    const fetchLogsAndStats = async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const [logsRes, statsRes] = await Promise.all([
                auditApi.getLogs({ limit: 50 }),
                auditApi.getStats()
            ]);
            if (logsRes?.logs) setLogs(logsRes.logs);
            if (statsRes?.stats) setStats(statsRes.stats);
        } catch (err) {
            console.error('Failed to load audit logs:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogsAndStats(); }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;
        const handleNewLog = (newLog) => {
            setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
            setStats((prev) => {
                if (!prev) return null;
                const newTotal = (prev.totalActions || 0) + 1;
                const isSucc = newLog.success !== false;
                const newSuccessCount = (prev.successfulActions || 0) + (isSucc ? 1 : 0);
                const isConf = Boolean(newLog.confirmedByUser);
                const newConfirmed = (prev.confirmedActions || 0) + (isConf ? 1 : 0);
                return {
                    ...prev,
                    totalActions: newTotal,
                    successfulActions: newSuccessCount,
                    failedActions: newTotal - newSuccessCount,
                    confirmedActions: newConfirmed,
                    successRatePercent: Math.round((newSuccessCount / newTotal) * 100),
                };
            });
        };
        socket.on('audit:new_log', handleNewLog);
        return () => { socket.off('audit:new_log', handleNewLog); };
    }, [socket]);

    const totalActions = stats?.totalActions ?? logs.length;
    const confirmedActions = stats?.confirmedActions ?? logs.filter((l) => l.confirmedByUser).length;
    const successRate =
        stats?.successRatePercent !== undefined
            ? stats.successRatePercent + '%'
            : logs.length > 0
                ? Math.round((logs.filter((l) => l.success !== false).length / logs.length) * 100) + '%'
                : '100%';

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const date = new Date(ts);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch { return ''; }
    };

    const formatFullTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const formatted = formatIndianDate(ts, 'short', true);
            return formatted || String(ts);
        } catch { return String(ts); }
    };

    // Filter matching logic operating entirely on frontend data
    const isCategoryMatch = (log, cat) => {
        if (cat === 'all') return true;
        const tool = (log?.tool || log?.action || log?.name || '').trim().toLowerCase();
        if (cat === 'calendar') {
            return (
                tool === 'create_calendar_event' ||
                tool === 'check_calendar_availability' ||
                tool.includes('calendar')
            );
        }
        if (cat === 'tasks') {
            return (
                tool === 'create_task' ||
                tool === 'complete_task' ||
                tool === 'list_tasks' ||
                tool.includes('task')
            );
        }
        return true;
    };

    const isStatusMatch = (log, status) => {
        if (status === 'all') return true;
        const outputResult = log?.result !== undefined ? log?.result : log?.outputResult;
        const isSuccess = log.success !== false && log.status !== 'error' && log.status !== 'failed' && !outputResult?.cancelled;
        const isPending = log.status === 'pending' || log.status === 'confirmation_required' || Boolean(log.pendingConfirmation);
        const isFailed = log.success === false || log.status === 'error' || log.status === 'failed' || Boolean(outputResult?.cancelled);

        if (status === 'successful') return isSuccess && !isPending;
        if (status === 'failed') return isFailed;
        if (status === 'pending') return isPending;
        return true;
    };

    const isActionMatch = (log, action) => {
        if (action === 'all') return true;
        const tool = (log?.tool || log?.action || log?.name || '').trim().toLowerCase();

        if (action === 'check_calendar_availability') {
            return (
                tool === 'check_calendar_availability' ||
                tool === 'check_availability' ||
                tool === 'calendar_availability' ||
                tool === 'checkcalendaravailability'
            );
        }
        if (action === 'create_calendar_event') {
            return (
                tool === 'create_calendar_event' ||
                tool === 'calendar_event' ||
                tool === 'createcalendarevent'
            );
        }
        if (action === 'create_task') {
            return tool === 'create_task' || tool === 'createtask';
        }
        if (action === 'complete_task') {
            return tool === 'complete_task' || tool === 'completetask';
        }
        return tool === action.toLowerCase();
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(
            (log) =>
                isCategoryMatch(log, categoryFilter) &&
                isStatusMatch(log, statusFilter) &&
                isActionMatch(log, actionFilter)
        );
    }, [logs, categoryFilter, statusFilter, actionFilter]);

    const visibleLogs = useMemo(() => {
        return filteredLogs.slice(0, displayLimit);
    }, [filteredLogs, displayLimit]);

    const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all' || actionFilter !== 'all';

    const handleClearFilters = () => {
        setCategoryFilter('all');
        setStatusFilter('all');
        setActionFilter('all');
        setDisplayLimit(10);
    };

    const handleCategoryChange = (newCat) => {
        setCategoryFilter(newCat);
        setDisplayLimit(10);
        // If the new category conflicts with the currently selected action, reset action to 'all'
        if (newCat === 'tasks' && (actionFilter === 'check_calendar_availability' || actionFilter === 'create_calendar_event')) {
            setActionFilter('all');
        } else if (newCat === 'calendar' && (actionFilter === 'create_task' || actionFilter === 'complete_task')) {
            setActionFilter('all');
        }
    };

    const handleActionChange = (newAction) => {
        setActionFilter(newAction);
        setDisplayLimit(10);
        // Auto-align category filter if a specific action belongs to a category
        if (newAction === 'check_calendar_availability' || newAction === 'create_calendar_event') {
            if (categoryFilter === 'tasks') {
                setCategoryFilter('calendar');
            }
        } else if (newAction === 'create_task' || newAction === 'complete_task') {
            if (categoryFilter === 'calendar') {
                setCategoryFilter('tasks');
            }
        }
    };

    const handleCopyMeet = (url, logKey) => {
        if (!url) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                setCopiedMeetId(logKey);
                setTimeout(() => {
                    setCopiedMeetId((prev) => (prev === logKey ? null : prev));
                }, 2000);
            }).catch(() => {});
        }
    };

    return (
        <div className="flex flex-col h-full bg-canvas-subtle">
            {/* Top metric bar */}
            <div className="p-2 border-b border-canvas-border flex items-center justify-between text-xs text-zinc-500 bg-white">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span>Total: <strong className="text-zinc-800">{totalActions}</strong></span>
                    <span>Confirmed: <strong className="text-zinc-800">{confirmedActions}</strong></span>
                    <span>Success: <strong className="text-zinc-800">{successRate}</strong></span>
                </div>
                <button onClick={fetchLogsAndStats} disabled={loading}
                    className="text-zinc-400 hover:text-zinc-700 p-1 rounded focus-ring transition-colors"
                    title="Refresh audit trail">
                    <RefreshCw className={'w-3 h-3 ' + (loading ? 'animate-spin' : '')} />
                </button>
            </div>

            {/* 14-day Data Retention Policy indicator */}
            <div className="px-3 py-1.5 bg-zinc-50 border-b border-canvas-border flex items-center justify-between text-[11px] text-zinc-600">
                <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Retention: Logs, traces & confirmations auto-expire after <strong>14 days</strong></span>
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    TTL Active
                </span>
            </div>

            {/* Compact Filter Bar */}
            <div className="px-3 py-2 bg-white border-b border-canvas-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="audit-filter-category" className="text-[11px] text-zinc-500 font-medium">Category:</label>
                        <select
                            id="audit-filter-category"
                            value={categoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="text-xs bg-zinc-50 border border-canvas-border rounded px-2 py-1 text-zinc-700 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="all">All Actions</option>
                            <option value="calendar">Calendar</option>
                            <option value="tasks">Tasks</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="audit-filter-status" className="text-[11px] text-zinc-500 font-medium">Status:</label>
                        <select
                            id="audit-filter-status"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setDisplayLimit(10); }}
                            className="text-xs bg-zinc-50 border border-canvas-border rounded px-2 py-1 text-zinc-700 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="successful">Successful</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Specific Action Filter */}
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="audit-filter-action" className="text-[11px] text-zinc-500 font-medium">Action:</label>
                        <select
                            id="audit-filter-action"
                            value={actionFilter}
                            onChange={(e) => handleActionChange(e.target.value)}
                            className="text-xs bg-zinc-50 border border-canvas-border rounded px-2 py-1 text-zinc-700 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="all">All Actions</option>
                            <option value="create_task">Task Created</option>
                            <option value="complete_task">Task Completed</option>
                            <option value="create_calendar_event">Calendar Event Created</option>
                            <option value="check_calendar_availability">Calendar Availability Checked</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200 transition-colors"
                            title="Reset all filters to default"
                        >
                            <RotateCcw className="w-3 h-3 text-zinc-500" />
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Matching record counter */}
                <div className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                    Showing <span className="font-semibold text-zinc-800">{visibleLogs.length}</span> of{' '}
                    <span className="font-semibold text-zinc-800">{filteredLogs.length}</span> matching
                    {filteredLogs.length !== logs.length && (
                        <span className="text-zinc-400 ml-1">({logs.length} total)</span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                {logs.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
                        <p>0 actions logged</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Every tool invocation and confirmation is committed to MongoDB.</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Records are kept for 14 days and automatically cleaned up via TTL indexes.</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    /* Friendly empty state when filters match 0 records */
                    <div className="h-44 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs">
                        <Filter className="w-8 h-8 text-zinc-300 mb-2" />
                        <p className="font-medium text-zinc-700">No audit records match your filters</p>
                        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                            Try adjusting your category, status, or specific action filter.
                        </p>
                        <button
                            onClick={handleClearFilters}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded border border-canvas-border transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-left text-xs text-zinc-700">
                            <thead className="bg-canvas-subtle text-zinc-500 border-b border-canvas-border sticky top-0 font-mono text-[10px] uppercase tracking-wider z-10">
                                <tr>
                                    <th className="py-2 px-3">ACTION</th>
                                    <th className="py-2 px-3">STATE</th>
                                    <th className="py-2 px-3">TIME</th>
                                    <th className="py-2 px-2 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-canvas-border font-mono text-[11px]">
                                {visibleLogs.map((log, index) => {
                                    const logKey = log._id || (String(log.conversationId || '') + '_' + String(log.timestamp || index));
                                    const isExpanded = expandedId === logKey;
                                    const isDevExpanded = expandedDevIds.has(logKey);
                                    const outputResult = log.result !== undefined ? log.result : log.outputResult;
                                    const isSuccess = log.success !== false && log.status !== 'error' && log.status !== 'failed' && !outputResult?.cancelled;
                                    const isPending = log.status === 'pending' || log.status === 'confirmation_required' || Boolean(log.pendingConfirmation);
                                    const timeStr = formatTimestamp(log.timestamp || log.createdAt);
                                    const inputArgs = log.args || log.inputArgs;
                                    const actionDisplay = getActionDisplay(log);
                                    const devEntityId = extractEntityId(log);
                                    const errorDetails = extractErrorDetails(log);

                                    return (
                                        <React.Fragment key={logKey}>
                                            <tr
                                                onClick={() => setExpandedId((prev) => prev === logKey ? null : logKey)}
                                                className="hover:bg-canvas-subtle cursor-pointer transition-colors"
                                            >
                                                <td className="py-2.5 px-3">
                                                    <div className="font-sans text-xs text-zinc-900 font-medium leading-snug">
                                                        {actionDisplay.primaryLabel}
                                                    </div>
                                                    {actionDisplay.hasSecondary && (
                                                        <div
                                                            className="font-sans text-[11px] text-zinc-500 font-normal leading-snug truncate max-w-[200px] sm:max-w-xs mt-0.5"
                                                            title={actionDisplay.secondaryInfo}
                                                        >
                                                            {actionDisplay.secondaryInfo}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                                                    {isPending ? (
                                                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium font-sans">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                            Pending
                                                        </span>
                                                    ) : isSuccess ? (
                                                        <span className="inline-flex items-center gap-1.5 text-zinc-700 font-medium font-sans">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                            {log.confirmedByUser ? 'Confirmed' : 'Executed'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium font-sans">
                                                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                            {outputResult?.cancelled ? 'Rejected' : 'Failed'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">{timeStr}</td>
                                                <td className="py-2.5 px-2 text-right text-zinc-400">
                                                    {isExpanded
                                                        ? <ChevronUp className="w-3.5 h-3.5 inline" />
                                                        : <ChevronDown className="w-3.5 h-3.5 inline" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-canvas-subtle">
                                                    <td colSpan={4} className="p-3 border-t border-canvas-border space-y-3 font-mono text-[10px]">
                                                        {/* Structured Human-Readable Activity Details */}
                                                        <ActivityDetails
                                                            log={log}
                                                            logKey={logKey}
                                                            copiedMeetId={copiedMeetId}
                                                            onCopyMeet={handleCopyMeet}
                                                        />

                                                        {/* Expandable Developer Details (Collapsed by default) */}
                                                        <div className="border border-canvas-border rounded-md bg-zinc-50 overflow-hidden">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedDevIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        if (next.has(logKey)) next.delete(logKey);
                                                                        else next.add(logKey);
                                                                        return next;
                                                                    });
                                                                }}
                                                                className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                            >
                                                                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                                                    <Code className="w-3.5 h-3.5 text-zinc-500" />
                                                                    Developer Details
                                                                </span>
                                                                {isDevExpanded ? (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                                                                ) : (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                                                )}
                                                            </button>

                                                            {isDevExpanded && (
                                                                <div className="p-3 border-t border-canvas-border space-y-3 bg-white text-xs font-mono">
                                                                    {/* Technical Metadata Grid */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 border-b border-canvas-border text-zinc-600 font-sans text-[11px]">
                                                                        <div>
                                                                            <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Original Tool</span>
                                                                            <span className="font-mono text-zinc-900 font-medium">{log.tool || 'N/A'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Timestamp</span>
                                                                            <span className="text-zinc-800">{formatFullTimestamp(log.timestamp || log.createdAt)}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Execution Status</span>
                                                                            <span className="font-medium">
                                                                                {isPending ? (
                                                                                    <span className="text-amber-700">Pending Execution</span>
                                                                                ) : isSuccess ? (
                                                                                    <span className="text-emerald-700">
                                                                                        {log.confirmedByUser ? 'Confirmed by User' : 'Executed Successfully'}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-rose-700">
                                                                                        {outputResult?.cancelled ? 'Cancelled / Rejected' : 'Execution Failed'}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        {devEntityId && (
                                                                            <div>
                                                                                <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Task / Event ID</span>
                                                                                <span className="font-mono text-zinc-800 break-all">{devEntityId}</span>
                                                                            </div>
                                                                        )}
                                                                        {log.executionTimeMs > 0 && (
                                                                            <div>
                                                                                <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">Execution Duration</span>
                                                                                <span className="font-mono text-zinc-800">{log.executionTimeMs}ms</span>
                                                                            </div>
                                                                        )}
                                                                        {errorDetails && (
                                                                            <div className="sm:col-span-2 text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                                                                                <span className="block text-[10px] uppercase font-mono tracking-wider text-rose-500 font-semibold">Error Details</span>
                                                                                <span className="font-mono text-[11px] break-all">{errorDetails}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Input Arguments JSON */}
                                                                    {inputArgs && Object.keys(inputArgs).length > 0 && (
                                                                        <div>
                                                                            <span className="text-zinc-500 block mb-1 font-sans text-[11px] font-medium">Input Arguments:</span>
                                                                            <pre className="p-2.5 rounded bg-zinc-900 text-emerald-400 overflow-x-auto text-[11px] font-mono leading-relaxed border border-zinc-800">
                                                                                {JSON.stringify(inputArgs, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}

                                                                    {/* Output Result JSON */}
                                                                    {outputResult !== undefined && (
                                                                        <div>
                                                                            <span className="text-zinc-500 block mb-1 font-sans text-[11px] font-medium">Output Result:</span>
                                                                            <pre className="p-2.5 rounded bg-zinc-900 text-sky-300 overflow-x-auto text-[11px] font-mono leading-relaxed border border-zinc-800">
                                                                                {typeof outputResult === 'object' ? JSON.stringify(outputResult, null, 2) : String(outputResult)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination / Show More Control */}
                        {visibleLogs.length < filteredLogs.length && (
                            <div className="p-3 border-t border-canvas-border bg-zinc-50 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDisplayLimit((prev) => prev + 10)}
                                    className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 rounded border border-canvas-border shadow-sm transition-colors"
                                >
                                    Show 10 more (showing {visibleLogs.length} of {filteredLogs.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDisplayLimit(filteredLogs.length)}
                                    className="text-xs text-zinc-500 hover:text-zinc-800 underline transition-colors"
                                >
                                    Show all ({filteredLogs.length})
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
