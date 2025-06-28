/**
 * Old Processor - Legacy Implementation
 * 
 * TO BE DELETED - Legacy data processing
 * This file will be removed as part of the MERGE_BEST_FEATURES strategy
 * 
 * Functionality will be moved to src/core/data-processor.ts
 */

// Legacy function-based approach
function processData(data, callback) {
  // Old callback-style processing
  setTimeout(() => {
    try {
      const result = data.map(item => {
        if (typeof item === 'string') {
          return item.toUpperCase();
        }
        return item;
      });
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  }, 100);
}

function validateInput(data) {
  // Basic validation
  return data && data.length > 0;
}

function transformData(data, options) {
  // Simple transformation
  return data.filter(item => item != null);
}

// Export legacy functions
module.exports = {
  processData,
  validateInput,
  transformData
}; 