import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bot, Calendar, Check, LogOut, HelpCircle, ExternalLink } from 'lucide-react';
import { authApi } from '../api/authApi';

export function Header({ onOpenInfo }) {
  const { user, isAuthenticated, isConnectedToCalendar, logout } = useAuth();
  const { isConnected: socketConnected } = useSocket();

  const handleGoogleConnect = () => {
    window.location.href = authApi.getGoogleConnectUrl();
  };

  return (
    <header className="border-b border-canvas-border bg-white px-4 sm:px-6 py-2.5">
      <div className="w-full flex items-center justify-between gap-4">
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
            <button
              onClick={handleGoogleConnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-900 bg-white hover:bg-zinc-50 border border-canvas-border shadow-xs hover:border-zinc-300 transition-colors focus-ring"
              title="Sign in with Google OAuth"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
