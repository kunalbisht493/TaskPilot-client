import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bot, Calendar, Check, LogOut, HelpCircle, ExternalLink } from 'lucide-react';
import { authApi } from '../api/authApi';

export function Header({ onOpenInfo }) {
  const { user, isAuthenticated, isConnectedToCalendar, devLogin, logout } = useAuth();
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
    <header className="border-b border-canvas-border bg-white px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-zinc-900 tracking-tight">TaskPilot</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">Autonomous Agent</span>
          </div>
        </div>

        {/* Center: Live stream indicator only (Provider completely removed as requested) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-600">
          <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
          <span>{socketConnected ? 'Real-time stream connected' : 'Connecting to gateway'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
            title="System specifications"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Calendar linked
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-zinc-700 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
                >
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  Connect Calendar
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-canvas-subtle border border-canvas-border rounded py-0.5 px-2 text-xs text-zinc-800">
                <span className="max-w-[120px] truncate font-medium">
                  {user?.name || user?.email || 'Logged in'}
                </span>
                <button
                  onClick={logout}
                  className="text-zinc-400 hover:text-rose-600 p-0.5 focus-ring"
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
                className="px-2.5 py-1 rounded text-xs text-zinc-800 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring disabled:opacity-50"
              >
                {loggingIn ? 'Authenticating...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-2.5 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-canvas-subtle border border-canvas-border focus-ring"
              >
                Google OAuth
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
