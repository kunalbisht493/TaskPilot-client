import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { auditApi } from '../api/auditApi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function AuditLogPanel() {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

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

    return (
        <div className="flex flex-col h-full bg-canvas-subtle">
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
            <div className="flex-1 overflow-y-auto bg-white">
                {logs.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
                        <p>0 actions logged</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Every tool invocation and confirmation is committed to MongoDB.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-canvas-subtle text-zinc-500 border-b border-canvas-border sticky top-0 font-mono text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="py-2 px-3">TOOL</th>
                                <th className="py-2 px-3">STATE</th>
                                <th className="py-2 px-3">TIME</th>
                                <th className="py-2 px-2 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-canvas-border font-mono text-[11px]">
                            {logs.map((log) => {
                                const logKey = log._id || (String(log.conversationId || '') + '_' + String(log.timestamp || Math.random()));
                                const isExpanded = expandedId === logKey;
                                const isSuccess = log.success !== false && log.status !== 'error' && log.status !== 'failed';
                                const timeStr = formatTimestamp(log.timestamp || log.createdAt);
                                const inputArgs = log.args || log.inputArgs;
                                const outputResult = log.result !== undefined ? log.result : log.outputResult;

                                return (
                                    <React.Fragment key={logKey}>
                                        <tr
                                            onClick={() => setExpandedId((prev) => prev === logKey ? null : logKey)}
                                            className="hover:bg-canvas-subtle cursor-pointer transition-colors"
                                        >
                                            <td className="py-2 px-3 text-zinc-900 font-medium">{log.tool}</td>
                                            <td className="py-2 px-3 text-[11px]">
                                                {isSuccess ? (
                                                    <span className="inline-flex items-center gap-1.5 text-zinc-700 font-medium">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        {log.confirmedByUser ? 'Confirmed' : 'Executed'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                                                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                        {log.result?.cancelled ? 'Rejected' : 'Failed'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-400 text-[11px]">{timeStr}</td>
                                            <td className="py-2 px-2 text-right text-zinc-400">
                                                {isExpanded
                                                    ? <ChevronUp className="w-3.5 h-3.5 inline" />
                                                    : <ChevronDown className="w-3.5 h-3.5 inline" />}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-canvas-subtle">
                                                <td colSpan={4} className="p-3 border-t border-canvas-border space-y-2 font-mono text-[10px]">
                                                    {log.executionTimeMs > 0 && (
                                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Execution time: <strong>{log.executionTimeMs}ms</strong></span>
                                                        </div>
                                                    )}
                                                    {inputArgs && (
                                                        <div>
                                                            <span className="text-zinc-500 block mb-1 font-sans text-[11px] font-medium">Input Arguments:</span>
                                                            <pre className="p-2 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border text-[11px]">
                                                                {JSON.stringify(inputArgs, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {outputResult !== undefined && (
                                                        <div>
                                                            <span className="text-zinc-500 block mb-1 font-sans text-[11px] font-medium">Output Result:</span>
                                                            <pre className="p-2 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border text-[11px]">
                                                                {typeof outputResult === 'object' ? JSON.stringify(outputResult, null, 2) : String(outputResult)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
