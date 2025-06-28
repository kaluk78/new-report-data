/**
 * Legacy Authentication Module
 * 
 * TO BE DELETED - Legacy implementation
 * Quality Score: 0.34
 * Usage Count: 8
 * Test Coverage: 23%
 * 
 * Reason for deletion: Legacy code, poor test coverage, outdated patterns
 */

// Old-style function declarations
function validateUser(email, password) {
  // Very basic validation - no type checking
  if (!email) return false;
  if (!password) return false;
  
  // Outdated email validation
  var emailParts = email.split('@');
  if (emailParts.length !== 2) return false;
  
  // Weak password validation
  if (password.length < 4) return false;
  
  return true;
}

function authenticateUser(email, password) {
  if (!validateUser(email, password)) {
    return null;
  }
  
  // Insecure token generation
  var token = email + '_' + password + '_' + Date.now();
  return token;
}

function checkAuth(token) {
  // No actual verification - just check if token exists
  return token && token.length > 0;
}

// Global variables - bad practice
var currentUser = null;
var isLoggedIn = false;

function login(email, password) {
  var token = authenticateUser(email, password);
  if (token) {
    currentUser = email;
    isLoggedIn = true;
    // Store in localStorage without encryption
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', email);
    return true;
  }
  return false;
}

function logout() {
  currentUser = null;
  isLoggedIn = false;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

function getCurrentUser() {
  return currentUser || localStorage.getItem('currentUser');
}

function isUserLoggedIn() {
  if (isLoggedIn) return true;
  
  var token = localStorage.getItem('authToken');
  return checkAuth(token);
}

// Export using old CommonJS style
module.exports = {
  validateUser: validateUser,
  authenticateUser: authenticateUser,
  checkAuth: checkAuth,
  login: login,
  logout: logout,
  getCurrentUser: getCurrentUser,
  isUserLoggedIn: isUserLoggedIn
};

// Deprecated jQuery-style ready function
$(document).ready(function() {
  // Auto-login check on page load
  if (isUserLoggedIn()) {
    console.log('User is already logged in:', getCurrentUser());
  }
}); 