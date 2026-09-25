import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bot, Calendar, Check, LogOut, HelpCircle, ExternalLink, Cpu } from 'lucide-react';
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
    <header className="border-b border-canvas-border bg-canvas px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & status */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-canvas-muted border border-canvas-border flex items-center justify-center text-zinc-300">
            <Bot className="w-4 h-4 text-zinc-200" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">TaskPilot</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">Agent Orchestration Console</span>
          </div>
        </div>

        {/* Runtime info */}
        <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Provider:</span>
            <span className="text-zinc-300 font-mono">
              {health?.activeLLMProvider ? health.activeLLMProvider.toUpperCase() : 'GROQ'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-amber-600'}`}></span>
            <span className="text-zinc-400">{socketConnected ? 'Live stream ready' : 'Connecting to gateway'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-canvas-subtle hover:bg-canvas-muted border border-canvas-borderSubtle focus-ring"
            title="View system architecture"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              {isConnectedToCalendar ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Check className="w-3 h-3 text-emerald-500" />
                  Calendar connected
                </span>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-zinc-300 bg-canvas-subtle hover:bg-canvas-muted border border-canvas-borderSubtle focus-ring"
                >
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Connect Calendar
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </button>
              )}

              <div className="flex items-center gap-2 bg-canvas-subtle border border-canvas-borderSubtle rounded py-0.5 px-2 text-xs text-zinc-300">
                <span className="max-w-[120px] truncate">
                  {user?.name || user?.email || 'Authenticated'}
                </span>
                <button
                  onClick={logout}
                  className="text-zinc-500 hover:text-rose-400 p-0.5 focus-ring"
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
                className="px-2.5 py-1 rounded text-xs text-zinc-200 bg-canvas-muted hover:bg-zinc-800 border border-canvas-border focus-ring disabled:opacity-50"
              >
                {loggingIn ? 'Signing in...' : 'Dev Quick Login'}
              </button>
              <button
                onClick={handleGoogleConnect}
                className="hidden sm:inline-flex px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-canvas-subtle border border-canvas-borderSubtle focus-ring"
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
