import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, RefreshCw, Calendar, Clock, AlertCircle } from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function TaskPanel() {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await taskApi.getTasks();
      if (res?.tasks) setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated]);

  // Real-time synchronization when agent executes task actions
  useEffect(() => {
    if (!socket) return;

    const handleLog = (log) => {
      const action = (log?.action || log?.tool || '').toLowerCase();
      if (action.includes('task')) {
        fetchTasks();
      }
    };

    const handleAgentComplete = () => {
      fetchTasks();
    };

    socket.on('audit:new_log', handleLog);
    socket.on('agent:complete', handleAgentComplete);

    return () => {
      socket.off('audit:new_log', handleLog);
      socket.off('agent:complete', handleAgentComplete);
    };
  }, [socket, isAuthenticated]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;
    try {
      setIsAdding(true);
      const res = await taskApi.createTask({
        title: newTitle.trim(),
        priority: newPriority,
      });
      if (res?.task) {
        setTasks(prev => [res.task, ...prev]);
        setNewTitle('');
      }
    } catch (err) {
      const msg = err.message || err.error || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert('Error creating task: ' + msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    if (currentStatus === 'completed' || !taskId) return;
    try {
      const res = await taskApi.completeTask(taskId);
      if (res?.task || res?.success) {
        setTasks(prev =>
          prev.map(t => {
            const currentId = t.id || t._id;
            if (currentId === taskId) {
              return { ...t, status: 'completed' };
            }
            return t;
          })
        );
      }
    } catch (err) {
      const msg = err.message || err.error || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert('Error completing task: ' + msg);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    try {
      await taskApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => (t.id || t._id) !== taskId));
    } catch (err) {
      const msg = err.message || err.error || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert('Error deleting task: ' + msg);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const renderPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high' || p === 'urgent') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
          High
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
          Low
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
        Med
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-canvas-subtle">
      {/* Sub-bar: filter tabs and refresh */}
      <div className="p-2 border-b border-canvas-border flex items-center justify-between text-xs bg-white">
        <div className="flex gap-1 text-xs">
          {['all', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-0.5 rounded text-[11px] capitalize transition-colors ${
                filter === tab
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded focus-ring"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-canvas-border bg-white">
        {filteredTasks.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-zinc-400 text-xs">
            <p className="font-medium text-zinc-600">0 tasks in this view</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Tasks created directly or by the agent persist in MongoDB.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskId = task.id || task._id;
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={taskId || Math.random()}
                className="flex items-center justify-between py-2.5 px-3 hover:bg-canvas-subtle/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(taskId, task.status)}
                    className="text-zinc-400 hover:text-zinc-700 flex-shrink-0 focus-ring rounded p-0.5"
                    title={isCompleted ? 'Completed' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-snug ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800 font-medium'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderPriorityBadge(task.priority)}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                          Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(taskId)}
                  className="text-zinc-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity focus-ring rounded"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Inline add task form at bottom */}
      <form onSubmit={handleCreateTask} className="p-2 border-t border-canvas-border bg-canvas-subtle flex items-center gap-1.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a new task..."
          className="flex-1 bg-white text-zinc-800 placeholder-zinc-400 rounded px-2 py-1 text-xs border border-canvas-border focus-ring"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-white text-zinc-600 rounded px-1.5 py-1 text-xs border border-canvas-border focus-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium focus-ring disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
