import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';

export function TaskPanel() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await taskApi.getTasks();
      if (res?.tasks) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated]);

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
      alert('Error creating task: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    if (currentStatus === 'completed') return;
    try {
      const res = await taskApi.completeTask(taskId);
      if (res?.task) {
        setTasks(prev => prev.map(t => t._id === taskId ? res.task : t));
      }
    } catch (err) {
      alert('Error completing task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-dark-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Database Tasks
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-850/50 flex gap-2 text-xs">
        {['all', 'pending', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-lg capitalize transition ${
              filter === tab
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inline Add Task Form */}
      <form onSubmit={handleCreateTask} className="p-3 border-b border-slate-800/80 bg-dark-950/40 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick add new task..."
          className="flex-1 bg-slate-800/60 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs border border-slate-700/60 outline-none focus:border-brand-500"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="bg-slate-800/60 text-slate-300 rounded-lg px-2 py-1.5 text-xs border border-slate-700/60 outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <CheckCircle2 className="w-8 h-8 mb-2 text-slate-700" />
            <p className="text-xs font-medium text-slate-400">No tasks found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tasks created directly or by the AI agent will appear here.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task._id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isCompleted 
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-60' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id, task.status)}
                    className="text-slate-400 hover:text-brand-400 flex-shrink-0 transition"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {task.priority || 'medium'}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition ml-2"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
