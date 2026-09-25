import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
        auditApi.getLogs({ limit: 15 }),
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

  // Live WebSocket listener for newly dispatched audit logs
  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      // Update quick count
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

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-dark-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Immutable Audit Trail
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {stats?.totalActions ?? logs.length} actions
          </span>
        </div>
        <button
          onClick={fetchLogsAndStats}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-dark-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Calls</span>
            <span className="text-sm font-bold text-slate-100 font-mono">{stats.totalActions || 0}</span>
          </div>
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confirmed</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{stats.confirmedByUser || 0}</span>
          </div>
          <div className="bg-slate-850/80 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Success Rate</span>
            <span className="text-sm font-bold text-accent-400 font-mono">
              {stats.totalActions > 0 
                ? Math.round(((stats.successCount || 0) / stats.totalActions) * 100) + '%'
                : '100%'}
            </span>
          </div>
        </div>
      )}

      {/* Log Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Layers className="w-8 h-8 mb-2 text-slate-700" />
            <p className="text-xs font-medium text-slate-400">No audit logs recorded yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Every tool invocation and human confirmation is logged immutably in MongoDB.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log._id;
            const isSuccess = log.status === 'success';

            return (
              <div 
                key={log._id || Math.random()}
                className="bg-slate-850/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition"
              >
                <div 
                  onClick={() => toggleExpand(log._id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isSuccess ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                      {log.tool}
                    </span>
                    {log.confirmedByUser ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
                        HITL Confirmed
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                        Read Action
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {log.executionDurationMs && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.executionDurationMs}ms
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Payload Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800 bg-dark-950/70 text-xs space-y-2">
                    {log.inputArgs && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">INPUT ARGS:</span>
                        <pre className="p-2 rounded bg-dark-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.inputArgs, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.outputResult && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">OUTPUT RESULT:</span>
                        <pre className="p-2 rounded bg-dark-950 text-emerald-400/90 font-mono text-[11px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.outputResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
