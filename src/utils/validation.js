/**
 * Input validation utilities for security
 */

// Sanitize string input - remove potentially dangerous characters
export function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = str
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Validate habit name
export function validateHabitName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Habit name is required and must be a string');
  }
  
  const sanitized = sanitizeString(name, 100);
  
  if (sanitized.length === 0) {
    throw new Error('Habit name cannot be empty');
  }
  
  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new Error('Habit name must be between 1 and 100 characters');
  }
  
  return sanitized;
}

// Validate icon (emoji or single character)
export function validateIcon(icon) {
  if (!icon || typeof icon !== 'string') {
    throw new Error('Icon is required');
  }
  
  // Allow emojis and basic characters, limit length
  const sanitized = sanitizeString(icon, 10);
  
  if (sanitized.length === 0) {
    throw new Error('Icon cannot be empty');
  }
  
  return sanitized;
}

// Validate time format (HH:mm)
export function validateTime(time) {
  if (!time) return '';
  
  if (typeof time !== 'string') {
    throw new Error('Time must be a string');
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    throw new Error('Invalid time format. Use HH:mm (24-hour format)');
  }
  
  return time;
}

// Validate duration (number in hours)
export function validateDuration(duration) {
  if (!duration) return '';
  
  const num = parseFloat(duration);
  if (isNaN(num) || num < 0 || num > 24) {
    throw new Error('Duration must be a number between 0 and 24 hours');
  }
  
  return String(num);
}

// Validate mood/motivation value (1-10)
export function validateMentalState(value, fieldName = 'Value') {
  if (value === null || value === undefined) {
    return null;
  }
  
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 10) {
    throw new Error(`${fieldName} must be a number between 1 and 10`);
  }
  
  return num;
}

// Validate date
export function validateDate(date) {
  if (!date) {
    throw new Error('Date is required');
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  return dateObj;
}

// Validate task text
export function validateTaskText(task) {
  if (!task || typeof task !== 'string') {
    throw new Error('Task text is required and must be a string');
  }
  
  const sanitized = sanitizeString(task, 500);
  
  if (sanitized.length === 0) {
    throw new Error('Task text cannot be empty');
  }
  
  if (sanitized.length > 500) {
    throw new Error('Task text must be 500 characters or less');
  }
  
  return sanitized;
}

// Validate priority
export function validatePriority(priority) {
  const validPriorities = ['High', 'Medium', 'Low', 'Optional'];
  
  if (!validPriorities.includes(priority)) {
    throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
  }
  
  return priority;
}

// Validate status
export function validateStatus(status) {
  const validStatuses = ['Not Started', 'In Progress', 'Completed'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  return status;
}

// Validate category
export function validateCategory(category) {
  const validCategories = ['Work', 'Money B', 'Ideas', 'Chores', 'Spirituality', 'Health'];
  
  if (!validCategories.includes(category)) {
    throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
  }
  
  return category;
}

// Validate user ID
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID is required');
  }
  
  // Firebase UIDs are typically 28 characters alphanumeric
  if (userId.length < 20 || userId.length > 128) {
    throw new Error('Invalid user ID format');
  }
  
  // Only allow alphanumeric and some safe characters
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('User ID contains invalid characters');
  }
  
  return userId;
}

