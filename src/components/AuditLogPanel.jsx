import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
        auditApi.getLogs({ limit: 20 }),
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

  useEffect(() => {
    fetchLogsAndStats();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 24)]);
      setStats((prev) => prev ? {
        ...prev,
        totalActions: (prev.totalActions || 0) + 1,
        confirmedByUser: newLog.confirmedByUser ? (prev.confirmedByUser || 0) + 1 : prev.confirmedByUser,
      } : null);
    };

    socket.on('audit:new_log', handleNewLog);
    return () => {
      socket.off('audit:new_log', handleNewLog);
    };
  }, [socket]);

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg flex flex-col h-[480px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-200">Action Audit Trail</h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-800 text-slate-400">
            {stats?.totalActions ?? logs.length} logged
          </span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded focus-ring transition-colors"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary stats row */}
      {stats && (
        <div className="grid grid-cols-3 divide-x divide-surface-800 border-b border-surface-800 bg-surface-950 text-xs">
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Total actions</span>
            <span className="font-semibold text-slate-200">{stats.totalActions || 0}</span>
          </div>
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Confirmed</span>
            <span className="font-semibold text-slate-200">{stats.confirmedByUser || 0}</span>
          </div>
          <div className="p-2 text-center">
            <span className="text-[11px] text-slate-400 block">Success rate</span>
            <span className="font-semibold text-slate-200">
              {stats.totalActions > 0 
                ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%' 
                : '100%'}
            </span>
          </div>
        </div>
      )}

      {/* Semantic Table of Logs */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4 text-xs text-slate-500">
            No audit records found
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-surface-950 text-slate-400 border-b border-surface-800 sticky top-0">
              <tr>
                <th className="py-2 px-3 font-medium">Tool</th>
                <th className="py-2 px-3 font-medium">State</th>
                <th className="py-2 px-3 font-medium">Time</th>
                <th className="py-2 px-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-850">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const isSuccess = log.status === 'success';

                return (
                  <React.Fragment key={log._id || Math.random()}>
                    <tr 
                      onClick={() => setExpandedId(prev => prev === log._id ? null : log._id)}
                      className="hover:bg-surface-850 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-200">
                        {log.tool}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.confirmedByUser ? 'Confirmed' : 'Read'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 inline text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 inline text-slate-400" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-950">
                        <td colSpan={4} className="p-3 border-t border-surface-850 space-y-2">
                          {log.inputArgs && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-medium block mb-1">Input arguments:</span>
                              <pre className="p-2 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                                {JSON.stringify(log.inputArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.outputResult && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-medium block mb-1">Output result:</span>
                              <pre className="p-2 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                                {JSON.stringify(log.outputResult, null, 2)}
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
