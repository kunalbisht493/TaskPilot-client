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
        auditApi.getLogs({ limit: 25 }),
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
      setLogs((prev) => [newLog, ...prev.slice(0, 29)]);
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
    <div className="flex flex-col h-full bg-canvas-subtle">
      {/* Sub-bar metrics */}
      <div className="p-2 border-b border-canvas-border flex items-center justify-between text-xs text-zinc-500 bg-white">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Total: <strong className="text-zinc-800">{stats?.totalActions ?? logs.length}</strong></span>
          <span>Confirmed: <strong className="text-zinc-800">{stats?.confirmedByUser || 0}</strong></span>
          <span>Success: <strong className="text-zinc-800">{stats?.totalActions > 0 ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%' : '100%'}</strong></span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded focus-ring"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Semantic Table of Logs */}
      <div className="flex-1 overflow-y-auto bg-white">
        {logs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
            <p>0 actions logged</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Every tool invocation and confirmation is committed to MongoDB.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-canvas-subtle text-zinc-500 border-b border-canvas-border sticky top-0 font-mono text-[10px]">
              <tr>
                <th className="py-1.5 px-3">TOOL</th>
                <th className="py-1.5 px-3">STATE</th>
                <th className="py-1.5 px-3">TIME</th>
                <th className="py-1.5 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border font-mono text-[11px]">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const isSuccess = log.status === 'success';

                return (
                  <React.Fragment key={log._id || Math.random()}>
                    <tr 
                      onClick={() => setExpandedId(prev => prev === log._id ? null : log._id)}
                      className="hover:bg-canvas-subtle cursor-pointer"
                    >
                      <td className="py-1.5 px-3 text-zinc-900 font-medium">
                        {log.tool}
                      </td>
                      <td className="py-1.5 px-3 text-[10px]">
                        <span className={`inline-flex items-center gap-1 ${isSuccess ? 'text-zinc-600' : 'text-rose-600'}`}>
                          {isSuccess ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3" />}
                          {log.confirmedByUser ? 'Confirmed' : 'Read'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-zinc-400 text-[10px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                      </td>
                      <td className="py-1.5 px-2 text-right text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 inline" />
                        ) : (
                          <ChevronDown className="w-3 h-3 inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-canvas-subtle">
                        <td colSpan={4} className="p-2.5 border-t border-canvas-border space-y-1.5 font-mono text-[10px]">
                          {log.inputArgs && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5 font-sans">Input arguments:</span>
                              <pre className="p-1.5 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border">
                                {JSON.stringify(log.inputArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.outputResult && (
                            <div>
                              <span className="text-zinc-500 block mb-0.5 font-sans">Output result:</span>
                              <pre className="p-1.5 rounded bg-white text-zinc-800 overflow-x-auto border border-canvas-border">
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
