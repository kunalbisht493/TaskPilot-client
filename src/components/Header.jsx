import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bot, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User, 
  Zap, 
  Info, 
  ExternalLink,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { authApi } from '../api/authApi';

export function Header({ onOpenInfo }) {
  const { user, isAuthenticated, isConnectedToCalendar, devLogin, logout, health } = useAuth();
  const { isConnected: socketConnected } = useSocket();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleDevLogin = async () => {
    try {
      setLoggingIn(true);
      await devLogin();
    } catch (err) {
      alert('Dev login failed: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = authApi.getGoogleConnectUrl();
  };

  return (
    <header className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/30 border border-brand-500/40 shadow-lg shadow-brand-500/10">
            <Bot className="w-5 h-5 text-brand-500" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                TaskPilot
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Autonomous Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hand-built ReAct Loop • Human-in-the-Loop Guardrails
            </p>
          </div>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-slate-800/50 border border-slate-700/60 rounded-full px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-slate-300 font-medium">LLM:</span>
            <span className="text-emerald-400 font-mono">
              {health?.activeLlmProvider ? health.activeLlmProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className="text-slate-300">{socketConnected ? 'Real-Time Stream' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Architecture Info Button */}
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
            title="View Architecture Details"
          >
            <Info className="w-3.5 h-3.5 text-accent-400" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {/* Calendar Status */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center">
              {isConnectedToCalendar ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Calendar Linked</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                </div>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect Calendar</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          )}

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 pr-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent-600 to-brand-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                  {user?.name || user?.email || 'Authenticated'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isConnectedToCalendar ? 'Calendar active' : 'Dev session'}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-1 text-slate-400 hover:text-rose-400 p-1 rounded-md transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDevLogin}
                disabled={loggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{loggingIn ? 'Connecting...' : 'Dev Quick Login'}</span>
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Google OAuth</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
