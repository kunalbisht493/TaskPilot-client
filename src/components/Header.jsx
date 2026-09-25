import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bot, 
  Calendar, 
  Check, 
  LogOut, 
  HelpCircle, 
  ExternalLink,
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
      alert('Login failed: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = authApi.getGoogleConnectUrl();
  };

  return (
    <header className="border-b border-surface-800 bg-surface-900 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-200">
            <Bot className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 tracking-tight">TaskPilot</span>
              <span className="text-xs text-slate-400 font-normal">Personal AI Assistant</span>
            </div>
          </div>
        </div>

        {/* Center status indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 border-l border-r border-surface-800 px-4">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Model:</span>
            <span className="font-medium text-slate-200">
              {health?.activeLLMProvider ? health.activeLLMProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>{socketConnected ? 'Real-time feed connected' : 'Connecting to feed...'}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-white bg-surface-850 hover:bg-surface-800 border border-surface-700 focus-ring transition-colors"
            title="System architecture specifications"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System details</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Calendar linked
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-200 bg-surface-800 hover:bg-surface-700 border border-surface-700 focus-ring"
                >
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Connect Google Calendar
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-surface-850 border border-surface-700 rounded-md py-1 px-2.5 text-xs text-slate-300">
                <span className="font-medium max-w-[120px] truncate">
                  {user?.name || user?.email || 'Logged in'}
                </span>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-400 p-0.5 ml-1 focus-ring"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDevLogin}
                disabled={loggingIn}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white focus-ring transition-colors disabled:opacity-50"
              >
                {loggingIn ? 'Authenticating...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-surface-800 hover:bg-surface-700 border border-surface-700 focus-ring transition-colors"
              >
                Google Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
