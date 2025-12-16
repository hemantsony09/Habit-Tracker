'use client'

import React, { useState, useEffect } from 'react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { useAuth } from '@/src/contexts/AuthContext';
import { getTasks, saveTask, deleteTask } from '@/src/services/firebaseApi';
import './TaskList.css';

const PRIORITY_COLORS = {
  High: '#f44336',
  Medium: '#ff9800',
  Low: '#2196F3',
  Optional: '#9e9e9e'
};

const CATEGORY_ICONS = {
  Work: '💼',
  'Money B': '💰',
  Ideas: '💡',
  Chores: '🧹',
  Spirituality: '🧘',
  Health: '💪'
};

function TaskList() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    task: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'Medium',
    status: 'Not Started',
    category: 'Work',
    completed: false
  });

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    if (!currentUser) return;
    try {
      const allTasks = await getTasks(currentUser.uid);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSaveTask = async () => {
    if (!newTask.task.trim() || !currentUser) return;

    const taskToSave = {
      ...newTask,
      dueDate: new Date(newTask.dueDate).toISOString(),
      id: editingTask ? editingTask.id : undefined
    };

    try {
      await saveTask(currentUser.uid, taskToSave);
      await loadTasks();
      setNewTask({
        task: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        priority: 'Medium',
        status: 'Not Started',
        category: 'Work',
        completed: false
      });
      setShowAddForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(currentUser.uid, taskId);
        await loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleToggleComplete = async (task) => {
    if (!currentUser) return;
    const updated = {
      ...task,
      completed: !task.completed,
      status: !task.completed ? 'Completed' : 'Not Started'
    };
    try {
      await saveTask(currentUser.uid, updated);
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      task: task.task,
      dueDate: format(parseISO(task.dueDate), 'yyyy-MM-dd'),
      priority: task.priority,
      status: task.status,
      category: task.category,
      completed: task.completed
    });
    setShowAddForm(true);
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'today') {
      return isToday(parseISO(task.dueDate));
    } else if (filter === 'overdue') {
      return isPast(parseISO(task.dueDate)) && !task.completed;
    } else if (filter === 'completed') {
      return task.completed;
    } else if (filter === 'active') {
      return !task.completed;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3, Optional: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Calculate statistics
  const today = new Date();
  const todayTasks = tasks.filter(t => isToday(parseISO(t.dueDate)) && !t.completed);
  const overdueTasks = tasks.filter(t => isPast(parseISO(t.dueDate)) && !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const getDateColor = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return '#4CAF50';
    if (isPast(date) && !tasks.find(t => t.id === dateStr)?.completed) return '#f44336';
    return '#333';
  };

  return (
    <div className="task-list">
      <div className="task-header">
        <div className="header-left">
          <div className="date-display">
            <div className="date-label">Date</div>
            <div className="date-value">{format(today, 'MM/dd/yyyy')}</div>
          </div>
          <h1>TASK LIST</h1>
        </div>
        <div className="summary-boxes">
          <div className="summary-box today">
            <div className="summary-label">Today</div>
            <div className="summary-value">{todayTasks.length}</div>
          </div>
          <div className="summary-box total">
            <div className="summary-label">Total Tasks</div>
            <div className="summary-value">{totalTasks}</div>
          </div>
          <div className="summary-box overdue">
            <div className="summary-label">Overdue</div>
            <div className="summary-value">{overdueTasks.length}</div>
          </div>
          <div className="summary-box not-completed">
            <div className="summary-label">Not C</div>
            <div className="summary-value">{totalTasks - completedTasks.length}</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-percentage">{progressPercentage.toFixed(1)}%</div>
        <div className="progress-bar-large">
          <div 
            className="progress-fill-large" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="task-controls">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'today' ? 'active' : ''}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button 
            className={filter === 'overdue' ? 'active' : ''}
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
        </div>
        <button className="add-task-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Task name"
              value={newTask.task}
              onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-row">
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="form-input"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="form-select"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Optional">Optional</option>
            </select>
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
              className="form-select"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              className="form-select"
            >
              <option value="Work">Work</option>
              <option value="Money B">Money B</option>
              <option value="Ideas">Ideas</option>
              <option value="Chores">Chores</option>
              <option value="Spirituality">Spirituality</option>
              <option value="Health">Health</option>
            </select>
          </div>
          <div className="form-actions">
            <button onClick={handleSaveTask} className="save-btn">
              {editingTask ? 'Update' : 'Save'}
            </button>
            {editingTask && (
              <button onClick={() => {
                setShowAddForm(false);
                setEditingTask(null);
                setNewTask({
                  task: '',
                  dueDate: format(new Date(), 'yyyy-MM-dd'),
                  priority: 'Medium',
                  status: 'Not Started',
                  category: 'Work',
                  completed: false
                });
              }} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>
                <span>Task</span>
                <span className="sort-arrow">▼</span>
              </th>
              <th onClick={() => setSortBy('dueDate')}>
                <span>Due Date</span>
                <span className="sort-arrow">▼</span>
              </th>
              <th onClick={() => setSortBy('priority')}>
                <span>Priority</span>
                <span className="sort-arrow">▼</span>
              </th>
              <th onClick={() => setSortBy('status')}>
                <span>Status</span>
                <span className="sort-arrow">▼</span>
              </th>
              <th>
                <span>Category</span>
                <span className="sort-arrow">▼</span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No tasks found. Add a new task to get started!
                </td>
              </tr>
            ) : (
              sortedTasks.map(task => (
                <tr key={task.id} className={task.completed ? 'completed' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                      className="task-checkbox"
                    />
                    <span className={task.completed ? 'strikethrough' : ''}>
                      {task.task}
                    </span>
                  </td>
                  <td style={{ color: getDateColor(task.dueDate) }}>
                    {format(parseISO(task.dueDate), 'dd.MM.yyyy')}
                  </td>
                  <td>
                    <span 
                      className="priority-dot" 
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                    ></span>
                    <span className={task.completed ? 'grayed-out' : ''}>{task.priority}</span>
                  </td>
                  <td>
                    <span className={`status-icon ${task.status.toLowerCase().replace(' ', '-')}`}>
                      {task.status === 'In Progress' ? '✏️' : '⚠️'}
                    </span>
                    <span className={task.completed ? 'grayed-out' : ''}>{task.status}</span>
                  </td>
                  <td>
                    <span className="category-icon">
                      {CATEGORY_ICONS[task.category] || '📋'}
                    </span>
                    <span className={task.completed ? 'grayed-out' : ''}>{task.category}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEditTask(task)}
                        className="edit-btn"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="delete-btn"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaskList;

