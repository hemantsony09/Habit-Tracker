// Firebase Firestore API service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

// Helper to get current user ID
const getUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
};

// Helper to get user collection reference
const getUserCollection = (collectionName) => {
  const userId = getUserId();
  return collection(db, 'users', userId, collectionName);
};

// Habit operations
export const getHabits = async () => {
  try {
    const habitsRef = getUserCollection('habits');
    const snapshot = await getDocs(habitsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting habits:', error);
    return [];
  }
};

export const saveHabit = async (habit) => {
  try {
    const habitsRef = getUserCollection('habits');
    if (habit.id) {
      // Update existing habit
      const habitRef = doc(habitsRef, habit.id);
      await updateDoc(habitRef, {
        name: habit.name,
        icon: habit.icon
      });
      return { id: habit.id, ...habit };
    } else {
      // Create new habit
      const docRef = await addDoc(habitsRef, {
        name: habit.name,
        icon: habit.icon,
        createdAt: new Date()
      });
      return { id: docRef.id, ...habit };
    }
  } catch (error) {
    console.error('Error saving habit:', error);
    throw error;
  }
};

export const deleteHabit = async (habitId) => {
  try {
    const habitsRef = getUserCollection('habits');
    const habitRef = doc(habitsRef, habitId);
    await deleteDoc(habitRef);
    
    // Also delete all completions for this habit
    const completionsRef = getUserCollection('habitCompletions');
    const completionsQuery = query(completionsRef, where('habitId', '==', habitId));
    const snapshot = await getDocs(completionsQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

// Habit completion operations
export const getHabitCompletions = async (month, year) => {
  try {
    const completionsRef = getUserCollection('habitCompletions');
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const q = query(
      completionsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        habitId: data.habitId,
        date: data.date.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date,
        completed: data.completed
      };
    });
  } catch (error) {
    console.error('Error getting habit completions:', error);
    return [];
  }
};

export const saveHabitCompletion = async (habitId, date, completed) => {
  try {
    const completionsRef = getUserCollection('habitCompletions');
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    // Check if completion already exists
    const q = query(
      completionsRef,
      where('habitId', '==', habitId),
      where('date', '==', dateObj)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create new completion
      await addDoc(completionsRef, {
        habitId,
        date: dateObj,
        completed
      });
    } else {
      // Update existing completion
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { completed });
    }
  } catch (error) {
    console.error('Error saving habit completion:', error);
    throw error;
  }
};

// Daily progress operations
export const getDailyProgress = async (month, year) => {
  try {
    const progressRef = getUserCollection('dailyProgress');
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const q = query(
      progressRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date,
        mood: data.mood,
        motivation: data.motivation
      };
    });
  } catch (error) {
    console.error('Error getting daily progress:', error);
    return [];
  }
};

export const saveDailyProgress = async (date, mood, motivation) => {
  try {
    const progressRef = getUserCollection('dailyProgress');
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    // Check if progress already exists
    const q = query(progressRef, where('date', '==', dateObj));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create new progress
      await addDoc(progressRef, {
        date: dateObj,
        mood,
        motivation
      });
    } else {
      // Update existing progress
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { mood, motivation });
    }
  } catch (error) {
    console.error('Error saving daily progress:', error);
    throw error;
  }
};

// Task operations
export const getTasks = async () => {
  try {
    const tasksRef = getUserCollection('tasks');
    const q = query(tasksRef, orderBy('dueDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate.toDate ? data.dueDate.toDate().toISOString() : data.dueDate
      };
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const saveTask = async (task) => {
  try {
    const tasksRef = getUserCollection('tasks');
    const dueDate = task.dueDate instanceof Date 
      ? task.dueDate 
      : new Date(task.dueDate);
    
    const taskData = {
      task: task.task,
      dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category,
      completed: task.completed || false
    };
    
    if (task.id) {
      // Update existing task
      const taskRef = doc(tasksRef, task.id);
      await updateDoc(taskRef, taskData);
      return { id: task.id, ...task };
    } else {
      // Create new task
      const docRef = await addDoc(tasksRef, {
        ...taskData,
        createdAt: new Date()
      });
      return { id: docRef.id, ...task };
    }
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const tasksRef = getUserCollection('tasks');
    const taskRef = doc(tasksRef, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
