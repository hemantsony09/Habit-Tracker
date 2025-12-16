'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';

// Helper function to format 24-hour time to 12-hour AM/PM
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes || '00'} ${ampm}`;
};
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from '@/src/contexts/AuthContext';
import { getHabits, saveHabit, deleteHabit, getHabitCompletions, saveHabitCompletion, getDailyProgress, saveDailyProgress } from '@/src/services/firebaseApi';
import './HabitTracker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ICON_OPTIONS = ['🕐', '💪', '📚', '📅', '💰', '🔧', '🚫', '📱', '📝', '❄️', '🏃', '🧘', '💤', '🍎', '💧', '📖', '✍️', '🎯', '🧹', '🎨', '🎵', '🌱', '☀️', '🌙'];

function HabitTracker() {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [dailyProgress, setDailyProgress] = useState({});
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✓', startTime: '', endTime: '', duration: '' });

  const loadHabits = useCallback(async () => {
    if (!currentUser) {
      setHabits([]);
      return;
    }
    try {
      console.log('Loading habits for user:', currentUser.uid);
      const savedHabits = await getHabits(currentUser.uid);
      console.log('Habits loaded from Firestore:', savedHabits);
      setHabits(savedHabits || []);
    } catch (error) {
      console.error('Error loading habits:', error);
      console.error('Error details:', error.code, error.message);
      setHabits([]);
    }
  }, [currentUser]);

  const loadCompletions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const monthCompletions = await getHabitCompletions(currentUser.uid, month, year);
      const completionMap = {};
      monthCompletions.forEach(c => {
        const key = `${c.habitId}-${c.date}`;
        completionMap[key] = c.completed;
      });
      setCompletions(completionMap);
    } catch (error) {
      console.error('Error loading completions:', error);
    }
  }, [currentUser, currentDate]);

  const loadDailyProgress = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, clearing daily progress');
      setDailyProgress({});
      return;
    }
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      console.log('🔄 Loading daily progress for:', { month, year });
      const progress = await getDailyProgress(currentUser.uid, month, year);
      console.log('✅ Daily progress loaded:', progress);
      const progressMap = {};
      progress.forEach(p => {
        // Ensure date format matches exactly (yyyy-MM-dd)
        const dateKey = p.date;
        progressMap[dateKey] = { 
          mood: p.mood !== undefined ? p.mood : null, 
          motivation: p.motivation !== undefined ? p.motivation : null 
        };
      });
      console.log('Progress map created:', progressMap);
      console.log('Progress map keys:', Object.keys(progressMap));
      setDailyProgress(progressMap);
    } catch (error) {
      console.error('❌ Error loading daily progress:', error);
      console.error('Error details:', error.code, error.message);
      setDailyProgress({});
    }
  }, [currentUser, currentDate]);

  useEffect(() => {
    if (!currentUser) return;
    // Load habits (start with empty list)
    loadHabits();
    loadCompletions();
    loadDailyProgress();
  }, [currentUser, loadHabits, loadCompletions, loadDailyProgress]);

  const toggleCompletion = async (habitId, date) => {
    if (!currentUser) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${habitId}-${dateStr}`;
    const newCompleted = !completions[key];
    
    setCompletions(prev => ({
      ...prev,
      [key]: newCompleted
    }));
    
    try {
      await saveHabitCompletion(currentUser.uid, habitId, date, newCompleted);
    } catch (error) {
      console.error('Error saving completion:', error);
      // Revert on error
      setCompletions(prev => ({
        ...prev,
        [key]: !newCompleted
      }));
    }
  };

  const updateMood = async (date, value) => {
    if (!currentUser) {
      console.warn('Cannot update mood: user not logged in');
      return;
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const current = dailyProgress[dateStr] || {};
    const moodValue = value ? parseInt(value) : null;
    const newProgress = { ...current, mood: moodValue };
    
    console.log('Updating mood:', { date: dateStr, dateObject: date, mood: moodValue, currentProgress: current });
    
    // Optimistically update UI
    setDailyProgress(prev => ({
      ...prev,
      [dateStr]: newProgress
    }));
    
    try {
      await saveDailyProgress(currentUser.uid, date, newProgress.mood, newProgress.motivation);
      console.log('✅ Mood saved successfully to Firestore');
      // Small delay before reload to ensure Firestore has updated
      setTimeout(async () => {
        await loadDailyProgress();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving mood:', error);
      console.error('Error code:', error.code, 'Error message:', error.message);
      // Revert on error
      setDailyProgress(prev => ({
        ...prev,
        [dateStr]: current
      }));
    }
  };

  const updateMotivation = async (date, value) => {
    if (!currentUser) {
      console.warn('Cannot update motivation: user not logged in');
      return;
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const current = dailyProgress[dateStr] || {};
    const motivationValue = value ? parseInt(value) : null;
    const newProgress = { ...current, motivation: motivationValue };
    
    console.log('Updating motivation:', { date: dateStr, dateObject: date, motivation: motivationValue, currentProgress: current });
    
    // Optimistically update UI
    setDailyProgress(prev => ({
      ...prev,
      [dateStr]: newProgress
    }));
    
    try {
      await saveDailyProgress(currentUser.uid, date, newProgress.mood, newProgress.motivation);
      console.log('✅ Motivation saved successfully to Firestore');
      // Small delay before reload to ensure Firestore has updated
      setTimeout(async () => {
        await loadDailyProgress();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving motivation:', error);
      console.error('Error code:', error.code, 'Error message:', error.message);
      // Revert on error
      setDailyProgress(prev => ({
        ...prev,
        [dateStr]: current
      }));
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate statistics
  const totalHabits = habits.length;
  let completedCount = 0;
  const habitStats = habits.map(habit => {
    let count = 0;
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const key = `${habit.id}-${dateStr}`;
      if (completions[key]) {
        count++;
        completedCount++;
      }
    });
    return { ...habit, count, goal: daysInMonth };
  });

  const totalPossible = totalHabits * daysInMonth;
  const overallProgress = totalPossible > 0 ? (completedCount / totalPossible) * 100 : 0;

  // Daily progress data
  const dailyProgressData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    let done = 0;
    habits.forEach(habit => {
      const key = `${habit.id}-${dateStr}`;
      if (completions[key]) done++;
    });
    return {
      date: format(day, 'MMM d'),
      done,
      notDone: totalHabits - done,
      progress: totalHabits > 0 ? (done / totalHabits) * 100 : 0
    };
  });

  // Progress chart data
  const progressChartData = {
    labels: dailyProgressData.map(d => d.date),
    datasets: [{
      label: 'Progress %',
      data: dailyProgressData.map(d => d.progress),
      borderColor: 'rgb(76, 175, 80)',
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  // Mental state chart data
  const mentalStateData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const progress = dailyProgress[dateStr] || {};
    const mood = progress.mood !== null && progress.mood !== undefined ? Number(progress.mood) : null;
    const motivation = progress.motivation !== null && progress.motivation !== undefined ? Number(progress.motivation) : null;
    
    console.log(`Date: ${dateStr}, Mood: ${mood}, Motivation: ${motivation}`, progress);
    
    // Calculate average only if both values exist
    if (mood !== null && motivation !== null) {
      return (mood + motivation) / 2;
    } else if (mood !== null) {
      return mood;
    } else if (motivation !== null) {
      return motivation;
    }
    return null;
  });

  console.log('Mental state data array:', mentalStateData);
  console.log('Daily progress state:', dailyProgress);

  // Prepare chart data - convert null to NaN for Chart.js
  const chartDataValues = mentalStateData.map(d => {
    // Scale to percentage (1-10 scale becomes 10-100%)
    if (d === null || d === undefined || isNaN(d)) {
      return NaN; // Chart.js uses NaN to skip points
    }
    const scaled = Number(d) * 10;
    return scaled;
  });

  console.log('Chart data values:', chartDataValues);
  console.log('Chart labels:', dailyProgressData.map(d => d.date));

  const mentalStateChartData = {
    labels: dailyProgressData.map(d => d.date),
    datasets: [{
      label: 'Mental State (%)',
      data: chartDataValues,
      borderColor: 'rgb(156, 39, 176)',
      backgroundColor: 'rgba(156, 39, 176, 0.2)',
      fill: true,
      tension: 0.4,
      spanGaps: true, // Connect points even with NaN values
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgb(156, 39, 176)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            const day = days[index];
            return format(day, 'MMM d, yyyy');
          },
          label: function(context) {
            if (context.parsed.y === null || isNaN(context.parsed.y)) return 'No data';
            const index = context.dataIndex;
            const day = days[index];
            const dateStr = format(day, 'yyyy-MM-dd');
            const progress = dailyProgress[dateStr] || {};
            const mood = progress.mood !== null && progress.mood !== undefined ? progress.mood : 'N/A';
            const motivation = progress.motivation !== null && progress.motivation !== undefined ? progress.motivation : 'N/A';
            return [
              context.dataset.label + ': ' + context.parsed.y.toFixed(0) + '%',
              'Mood: ' + mood + '/10',
              'Motivation: ' + motivation + '/10'
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          stepSize: 20
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2
      }
    }
  };

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const changeYear = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + direction);
      return newDate;
    });
  };

  const handleAddHabit = () => {
    setEditingHabit(null);
    setNewHabit({ name: '', icon: '✓', startTime: '', endTime: '', duration: '' });
    setShowHabitForm(true);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setNewHabit({ 
      name: habit.name, 
      icon: habit.icon, 
      startTime: habit.startTime || '', 
      endTime: habit.endTime || '',
      duration: habit.duration || ''
    });
    setShowHabitForm(true);
  };

  const handleSaveHabit = async () => {
    console.log('handleSaveHabit called', { newHabit, currentUser: currentUser?.uid });
    
    if (!newHabit.name.trim()) {
      alert('Please enter a habit name');
      return;
    }
    
    if (!currentUser) {
      alert('You must be logged in to create habits');
      return;
    }

      const habitToSave = {
        name: newHabit.name.trim(),
        icon: newHabit.icon,
        startTime: newHabit.startTime || '',
        endTime: newHabit.endTime || '',
        duration: newHabit.duration || '',
        id: editingHabit ? editingHabit.id : undefined
      };

    console.log('Saving habit to Firebase:', habitToSave);

    try {
      console.log('⏳ Starting save operation...');
      const savedHabit = await saveHabit(currentUser.uid, habitToSave);
      console.log('✅ Habit saved successfully to Firestore:', savedHabit);
      
      // Close modal immediately
      console.log('🔄 Closing modal...');
      setShowHabitForm(false);
      setEditingHabit(null);
      setNewHabit({ name: '', icon: '✓', startTime: '', endTime: '', duration: '' });
      
      // Reload habits immediately and then again after a delay
      console.log('🔄 Reloading habits...');
      await loadHabits();
      
      // Also reload after a short delay to catch any eventual consistency
      setTimeout(async () => {
        console.log('🔄 Reloading habits again (eventual consistency check)...');
        await loadHabits();
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving habit:', error);
      console.error('Error details:', error.code, error.message, error.stack);
      alert(`Failed to save habit: ${error.message || 'Unknown error'}\n\nError code: ${error.code || 'N/A'}\n\nCheck console for details.`);
      // Don't close modal on error so user can retry
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to delete this habit? All completion data will be lost.')) {
      try {
        await deleteHabit(currentUser.uid, habitId);
        await loadHabits();
        // Reload completions to remove deleted habit's data
        await loadCompletions();
      } catch (error) {
        console.error('Error deleting habit:', error);
        alert('Failed to delete habit. Please try again.');
      }
    }
  };

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <div className="month-controls">
          <div className="year-navigation">
            <button onClick={() => changeYear(-1)} className="year-btn" title="Previous Year">«</button>
            <span className="year-display">{format(currentDate, 'yyyy')}</span>
            <button onClick={() => changeYear(1)} className="year-btn" title="Next Year">»</button>
          </div>
          <div className="month-navigation">
            <button onClick={() => changeMonth(-1)} className="month-btn" title="Previous Month">‹</button>
            <h1>{format(currentDate, 'MMMM yyyy')}</h1>
            <button onClick={() => changeMonth(1)} className="month-btn" title="Next Month">›</button>
          </div>
        </div>
        <div className="header-right-section">
        <div className="header-actions">
          <button className="add-habit-btn" onClick={handleAddHabit}>
            + Add Habit
          </button>
        </div>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Number of habits:</span>
            <span className="stat-value">{totalHabits}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed habits:</span>
            <span className="stat-value">{completedCount}</span>
          </div>
          <div className="stat-item progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">Progress in %: {overallProgress.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {showHabitForm && (
        <div 
          className="habit-form-modal"
          onClick={(e) => {
            if (e.target.className === 'habit-form-modal') {
              setShowHabitForm(false);
              setEditingHabit(null);
              setNewHabit({ name: '', icon: '✓', startTime: '', endTime: '', duration: '' });
            }
          }}
        >
          <div className="habit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingHabit ? 'Edit Habit' : 'Add New Habit'}</h3>
            <div className="form-group">
              <label>Habit Name</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="Enter habit name"
                className="form-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Time Settings (Optional)</label>
              <div className="time-options">
                <div className="time-option-group">
                  <label className="time-option-label">
                    <input
                      type="radio"
                      name="timeType"
                      checked={!newHabit.duration && (newHabit.startTime || newHabit.endTime)}
                      onChange={() => setNewHabit({ ...newHabit, duration: '' })}
                      className="time-radio"
                    />
                    <span>Time Range</span>
                  </label>
                  <div className="time-inputs">
                    <select
                      value={newHabit.startTime}
                      onChange={(e) => setNewHabit({ ...newHabit, startTime: e.target.value })}
                      className="form-select time-select"
                    >
                      <option value="">Start time</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour24 = i;
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const ampm = hour24 < 12 ? 'AM' : 'PM';
                        const displayTime = `${hour12}:00 ${ampm}`;
                        const value = `${String(hour24).padStart(2, '0')}:00`;
                        return (
                          <option key={value} value={value}>{displayTime}</option>
                        );
                      })}
                    </select>
                    <span className="time-separator">to</span>
                    <select
                      value={newHabit.endTime}
                      onChange={(e) => setNewHabit({ ...newHabit, endTime: e.target.value })}
                      className="form-select time-select"
                    >
                      <option value="">End time</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour24 = i;
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const ampm = hour24 < 12 ? 'AM' : 'PM';
                        const displayTime = `${hour12}:00 ${ampm}`;
                        const value = `${String(hour24).padStart(2, '0')}:00`;
                        return (
                          <option key={value} value={value}>{displayTime}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="time-option-group">
                  <label className="time-option-label">
                    <input
                      type="radio"
                      name="timeType"
                      checked={!!newHabit.duration}
                      onChange={() => setNewHabit({ ...newHabit, startTime: '', endTime: '' })}
                      className="time-radio"
                    />
                    <span>Duration (hours)</span>
                  </label>
                  <select
                    value={newHabit.duration}
                    onChange={(e) => setNewHabit({ ...newHabit, duration: e.target.value })}
                    className="form-select duration-select"
                  >
                    <option value="">Select duration</option>
                    {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12].map(hours => (
                      <option key={hours} value={hours}>{hours}h</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Icon</label>
              <div className="icon-selector">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${newHabit.icon === icon ? 'selected' : ''}`}
                    onClick={() => setNewHabit({ ...newHabit, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="button"
                onClick={handleSaveHabit} 
                className="save-btn" 
                disabled={!newHabit.name.trim()}
              >
                {editingHabit ? 'Update' : 'Add'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowHabitForm(false);
                  setEditingHabit(null);
                  setNewHabit({ name: '', icon: '✓', startTime: '', endTime: '', duration: '' });
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="empty-habits">
          <p>No habits yet. Click &quot;Add Habit&quot; to get started!</p>
        </div>
      ) : (
        <div className="habit-grid-container">
          <table className="habit-grid">
            <thead>
              <tr>
                <th className="habit-name-col">My Habits</th>
                {days.map(day => (
                  <th key={format(day, 'yyyy-MM-dd')} className="day-header">
                    <div className="day-label">{format(day, 'EEE')}</div>
                    <div className="day-number">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id}>
                  <td className="habit-name-cell">
                    <div className="habit-name-content">
                      <span className="habit-icon">{habit.icon}</span>
                      <div className="habit-name-wrapper">
                        <span className="habit-name-text">{habit.name}</span>
                        {habit.duration && (
                          <span className="habit-time">{habit.duration}h</span>
                        )}
                        {!habit.duration && habit.startTime && habit.endTime && (
                          <span className="habit-time">{formatTime12Hour(habit.startTime)} - {formatTime12Hour(habit.endTime)}</span>
                        )}
                        {!habit.duration && habit.startTime && !habit.endTime && (
                          <span className="habit-time">{formatTime12Hour(habit.startTime)}</span>
                        )}
                      </div>
                      <div className="habit-actions">
                        <button
                          className="edit-habit-btn"
                          onClick={() => handleEditHabit(habit)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-habit-btn"
                          onClick={() => handleDeleteHabit(habit.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = `${habit.id}-${dateStr}`;
                    const completed = completions[key] || false;
                    return (
                      <td key={dateStr} className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => toggleCompletion(habit.id, day)}
                          className="habit-checkbox"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {habits.length > 0 && (
        <>
          <div className="daily-progress-summary">
            <div className="summary-row">
              <div className="summary-label">Progress</div>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const data = dailyProgressData.find(d => d.date === format(day, 'MMM d'));
                return (
                  <div key={dateStr} className="summary-cell">
                    {data ? `${data.progress.toFixed(0)}%` : '0%'}
                  </div>
                );
              })}
            </div>
            <div className="summary-row">
              <div className="summary-label">Done</div>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const data = dailyProgressData.find(d => d.date === format(day, 'MMM d'));
                return (
                  <div key={dateStr} className="summary-cell">
                    {data ? data.done : 0}
                  </div>
                );
              })}
            </div>
            <div className="summary-row">
              <div className="summary-label">Not Done</div>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const data = dailyProgressData.find(d => d.date === format(day, 'MMM d'));
                return (
                  <div key={dateStr} className="summary-cell">
                    {data ? data.notDone : totalHabits}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h3>Progress Trend</h3>
              <div className="chart-wrapper">
                <Line data={progressChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {habits.length > 0 && (
        <div className="analysis-section">
          <h3>Analysis</h3>
          <table className="analysis-table">
            <thead>
              <tr>
                <th>Habit</th>
                <th>Goal</th>
                <th>Actual</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {habitStats.map(habit => (
                <tr key={habit.id}>
                  <td>
                    <span className="analysis-habit-icon">{habit.icon}</span>
                    {habit.name}
                  </td>
                  <td>{habit.goal}</td>
                  <td>{habit.count}</td>
                  <td>
                    <div className="progress-bar-small">
                      <div 
                        className="progress-fill-small" 
                        style={{ width: `${(habit.count / habit.goal) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mental-state-section">
        <h3>Mental State</h3>
        <div className="mental-state-grid">
          <div className="mental-state-row mental-state-date-row">
            <div className="mental-state-label">Date</div>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return (
                <div key={dateStr} className="mental-state-cell mental-state-date-cell">
                  <div className="mental-state-day-label">{format(day, 'EEE')}</div>
                  <div className="mental-state-day-number">{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>
          <div className="mental-state-row">
            <div className="mental-state-label">Mood</div>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const progress = dailyProgress[dateStr] || {};
              const moodValue = progress.mood !== null && progress.mood !== undefined ? String(progress.mood) : '';
              return (
                <div key={dateStr} className="mental-state-cell">
                  <select
                    value={moodValue}
                    onChange={(e) => updateMood(day, e.target.value)}
                    className="mental-state-select"
                    title={`Mood for ${format(day, 'MMM d, yyyy')}`}
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="mental-state-row">
            <div className="mental-state-label">Motivation</div>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const progress = dailyProgress[dateStr] || {};
              const motivationValue = progress.motivation !== null && progress.motivation !== undefined ? String(progress.motivation) : '';
              return (
                <div key={dateStr} className="mental-state-cell">
                  <select
                    value={motivationValue}
                    onChange={(e) => updateMotivation(day, e.target.value)}
                    className="mental-state-select"
                    title={`Motivation for ${format(day, 'MMM d, yyyy')}`}
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-wrapper">
            <Line data={mentalStateChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitTracker;

