import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { 
  validateUserId, 
  validateHabitName, 
  validateIcon, 
  validateTime, 
  validateDuration,
  validateMentalState,
  validateDate,
  validateTaskText,
  validatePriority,
  validateStatus,
  validateCategory
} from '@/src/utils/validation';

// Helper to get user's collection reference
const getUserCollection = (userId, collectionName) => {
  return collection(db, 'users', userId, collectionName);
};

// Habit operations
export const getHabits = async (userId) => {
  try {
    console.log('getHabits called for userId:', userId);
    const habitsRef = getUserCollection(userId, 'habits');
    console.log('Habits collection reference:', habitsRef.path);
    const snapshot = await getDocs(habitsRef);
    console.log('Firestore snapshot:', snapshot.empty ? 'empty' : `${snapshot.size} documents`);
    const habits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Parsed habits:', habits);
    return habits;
  } catch (error) {
    console.error('Error getting habits:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return [];
  }
};

export const saveHabit = async (userId, habit) => {
  try {
    // Validate inputs
    validateUserId(userId);
    const validatedName = validateHabitName(habit.name);
    const validatedIcon = validateIcon(habit.icon);
    const validatedStartTime = habit.startTime ? validateTime(habit.startTime) : '';
    const validatedEndTime = habit.endTime ? validateTime(habit.endTime) : '';
    const validatedDuration = habit.duration ? validateDuration(habit.duration) : '';
    
    console.log('saveHabit called:', { userId, habit });
    const habitsRef = getUserCollection(userId, 'habits');
    console.log('Habits collection path:', habitsRef.path);
    
    if (habit.id) {
      // Update existing habit
      console.log('Updating existing habit:', habit.id);
      const habitRef = doc(habitsRef, habit.id);
      await updateDoc(habitRef, {
        name: validatedName,
        icon: validatedIcon,
        startTime: validatedStartTime,
        endTime: validatedEndTime,
        duration: validatedDuration
      });
      console.log('Habit updated successfully');
      return { id: habit.id, name: validatedName, icon: validatedIcon, startTime: validatedStartTime, endTime: validatedEndTime, duration: validatedDuration };
    } else {
      // Create new habit
      console.log('Creating new habit');
      const newHabit = {
        name: validatedName,
        icon: validatedIcon,
        startTime: validatedStartTime,
        endTime: validatedEndTime,
        duration: validatedDuration,
        createdAt: Timestamp.now()
      };
      console.log('Habit data to save:', newHabit);
      console.log('Collection reference:', habitsRef);
      console.log('About to call addDoc...');
      
      try {
        const docRef = await addDoc(habitsRef, newHabit);
        console.log('✅ Habit created successfully!');
        console.log('Habit ID:', docRef.id);
        console.log('Full document path:', docRef.path);
        const result = { id: docRef.id, ...newHabit };
        console.log('Returning habit:', result);
        return result;
      } catch (addDocError) {
        console.error('❌ addDoc failed:', addDocError);
        console.error('addDoc error code:', addDocError.code);
        console.error('addDoc error message:', addDocError.message);
        throw addDocError;
      }
    }
  } catch (error) {
    console.error('❌ Error saving habit:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

export const deleteHabit = async (userId, habitId) => {
  try {
    // Validate inputs
    validateUserId(userId);
    if (!habitId || typeof habitId !== 'string') {
      throw new Error('Habit ID is required');
    }
    
    const habitRef = doc(getUserCollection(userId, 'habits'), habitId);
    await deleteDoc(habitRef);
    
    // Also delete all completions for this habit
    const completionsRef = getUserCollection(userId, 'habitCompletions');
    const completionsSnapshot = await getDocs(
      query(completionsRef, where('habitId', '==', habitId))
    );
    
    const deletePromises = completionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

// Habit completion operations
export const getHabitCompletions = async (userId, month, year) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const completionsRef = getUserCollection(userId, 'habitCompletions');
    const q = query(
      completionsRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        habitId: data.habitId,
        date: data.date.toDate().toISOString().split('T')[0],
        completed: data.completed
      };
    });
  } catch (error) {
    console.error('Error getting habit completions:', error);
    return [];
  }
};

export const saveHabitCompletion = async (userId, habitId, date, completed) => {
  try {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    const completionsRef = getUserCollection(userId, 'habitCompletions');
    const completionQuery = query(
      completionsRef,
      where('habitId', '==', habitId),
      where('date', '==', Timestamp.fromDate(dateObj))
    );
    
    const snapshot = await getDocs(completionQuery);
    
    if (snapshot.empty) {
      // Create new completion
      await addDoc(completionsRef, {
        habitId,
        date: Timestamp.fromDate(dateObj),
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
export const getDailyProgress = async (userId, month, year) => {
  try {
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    const progressRef = getUserCollection(userId, 'dailyProgress');
    
    const q = query(
      progressRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    const toLocalDateString = (date) => {
      const d = date instanceof Date ? date : new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const progressData = snapshot.docs.map(doc => {
      const data = doc.data();
      const docDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      // Use local date string, not UTC
      const localDateStr = toLocalDateString(docDate);
      return {
        id: doc.id,
        date: localDateStr,
        mood: data.mood !== undefined ? data.mood : null,
        motivation: data.motivation !== undefined ? data.motivation : null
      };
    });
    return progressData;
  } catch (error) {
    console.error('❌ Error getting daily progress:', error);
    return [];
  }
};

export const saveDailyProgress = async (userId, date, mood, motivation) => {
  try {
    validateUserId(userId);
    let dateObj = validateDate(date);
    
    // Get the local date components (what the user sees)
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    // Create date at UTC midnight for the target date to avoid timezone shifts
    // This ensures the date stored matches what the user selected
    dateObj = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    
    const validatedMood = validateMentalState(mood, 'Mood');
    const validatedMotivation = validateMentalState(motivation, 'Motivation');
    const progressRef = getUserCollection(userId, 'dailyProgress');
    
    const dateTimestamp = Timestamp.fromDate(dateObj);
    
    const progressQuery = query(
      progressRef,
      where('date', '==', dateTimestamp)
    );
    
    const snapshot = await getDocs(progressQuery);
    
    if (snapshot.empty) {
      const newProgress = {
        date: dateTimestamp,
        mood: validatedMood,
        motivation: validatedMotivation
      };
      const docRef = await addDoc(progressRef, newProgress);
      return docRef.id;
    } else {
      const docRef = snapshot.docs[0].ref;
      const updateData = {
        mood: validatedMood,
        motivation: validatedMotivation
      };
      await updateDoc(docRef, updateData);
      return docRef.id;
    }
  } catch (error) {
    console.error('❌ Error saving daily progress:', error);
    throw error;
  }
};

// Task operations
export const getTasks = async (userId) => {
  try {
    const tasksRef = getUserCollection(userId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate().toISOString() || data.dueDate
      };
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const saveTask = async (userId, task) => {
  try {
    // Validate inputs
    validateUserId(userId);
    const validatedTask = validateTaskText(task.task);
    const validatedPriority = validatePriority(task.priority);
    const validatedStatus = validateStatus(task.status);
    const validatedCategory = validateCategory(task.category);
    const validatedDueDate = validateDate(task.dueDate);
    
    const tasksRef = getUserCollection(userId, 'tasks');
    const taskData = {
      task: validatedTask,
      dueDate: Timestamp.fromDate(validatedDueDate),
      priority: validatedPriority,
      status: validatedStatus,
      category: validatedCategory,
      completed: task.completed || false
    };
    
    if (task.id) {
      // Update existing task
      const taskRef = doc(tasksRef, task.id);
      await updateDoc(taskRef, taskData);
      return { id: task.id, ...taskData };
    } else {
      // Create new task
      taskData.createdAt = Timestamp.now();
      const docRef = await addDoc(tasksRef, taskData);
      return { id: docRef.id, ...taskData };
    }
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const deleteTask = async (userId, taskId) => {
  try {
    // Validate inputs
    validateUserId(userId);
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('Task ID is required');
    }
    
    const taskRef = doc(getUserCollection(userId, 'tasks'), taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

