// js/calculator.js
import { showToast } from './common.js';

const form = document.getElementById('calcForm');
const resultSection = document.getElementById('result');

// Animation utility functions
function animateCounter(element, start, end, duration = 2000) {
  const startTime = performance.now();
  const startValue = parseInt(start) || 0;
  const endValue = parseInt(end);
  const difference = endValue - startValue;

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (difference * easedProgress));
    
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function animateProgressBar(element, targetPercentage, duration = 2000, delay = 0) {
  setTimeout(() => {
    element.style.width = `${targetPercentage}%`;
    element.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }, delay);
}

// Calculation functions
function calculateBMR(weight, height, age, gender) {
  // Mifflin-St Jeor Equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(baseBMR + (gender === 'male' ? 5 : -161));
}

function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * activityLevel);
}

function calculateMacros(tdee) {
  // Macronutrient breakdown (50% carbs, 20% protein, 30% fat)
  const carbsCalories = tdee * 0.50;
  const proteinCalories = tdee * 0.20;
  const fatCalories = tdee * 0.30;
  
  return {
    carbs: {
      grams: Math.round(carbsCalories / 4),
      calories: Math.round(carbsCalories)
    },
    protein: {
      grams: Math.round(proteinCalories / 4),
      calories: Math.round(proteinCalories)
    },
    fat: {
      grams: Math.round(fatCalories / 9),
      calories: Math.round(fatCalories)
    }
  };
}

// Form validation
function validateForm(age, height, weight) {
  const errors = [];
  
  if (!age || age < 10 || age > 120) {
    errors.push('Please enter a valid age (10-120 years)');
  }
  
  if (!height || height < 100 || height > 250) {
    errors.push('Please enter a valid height (100-250 cm)');
  }
  
  if (!weight || weight < 30 || weight > 300) {
    errors.push('Please enter a valid weight (30-300 kg)');
  }
  
  return errors;
}

// Main calculation and display function
function calculateAndDisplay(formData) {
  const { age, gender, height, weight, activityLevel } = formData;
  
  // Validate inputs
  const errors = validateForm(age, height, weight);
  if (errors.length > 0) {
    showToast(errors[0], 'error');
    return;
  }
  
  try {
    // Calculate BMR and TDEE
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const macros = calculateMacros(tdee);
    
    // Show results section
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Animate counters with staggered timing
    setTimeout(() => {
      animateCounter(document.getElementById('bmr'), 0, bmr, 1500);
    }, 200);
    
    setTimeout(() => {
      animateCounter(document.getElementById('tdee'), 0, tdee, 1500);
    }, 400);
    
    // Animate macro values
    setTimeout(() => {
      animateCounter(document.getElementById('carbs'), 0, macros.carbs.grams, 1500);
      animateCounter(document.getElementById('carbsCal'), 0, macros.carbs.calories, 1500);
    }, 600);
    
    setTimeout(() => {
      animateCounter(document.getElementById('protein'), 0, macros.protein.grams, 1500);
      animateCounter(document.getElementById('proteinCal'), 0, macros.protein.calories, 1500);
    }, 800);
    
    setTimeout(() => {
      animateCounter(document.getElementById('fat'), 0, macros.fat.grams, 1500);
      animateCounter(document.getElementById('fatCal'), 0, macros.fat.calories, 1500);
    }, 1000);
    
    // Animate progress bars
    animateProgressBar(document.getElementById('pCarbs'), 50, 1500, 1200);
    animateProgressBar(document.getElementById('pProtein'), 20, 1500, 1400);
    animateProgressBar(document.getElementById('pFat'), 30, 1500, 1600);
    
    // Show success message
    setTimeout(() => {
      showToast('Calculation complete! Scroll down to see your results.', 'success');
    }, 500);
    
  } catch (error) {
    console.error('Calculation error:', error);
    showToast('An error occurred during calculation. Please try again.', 'error');
  }
}

// Form submission handler
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Get form values
  const formData = {
    age: parseInt(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    height: parseInt(document.getElementById('height').value),
    weight: parseInt(document.getElementById('weight').value),
    activityLevel: parseFloat(document.getElementById('activity').value)
  };
  
  // Reset progress bars before new calculation
  const progressBars = ['pCarbs', 'pProtein', 'pFat'];
  progressBars.forEach(id => {
    const element = document.getElementById(id);
    element.style.width = '0%';
    element.style.transition = 'none';
  });
  
  // Perform calculation
  calculateAndDisplay(formData);
});

// Add input validation feedback
const inputs = ['age', 'height', 'weight'];
inputs.forEach(inputId => {
  const input = document.getElementById(inputId);
  input.addEventListener('blur', () => {
    const value = parseInt(input.value);
    const errors = validateForm(
      inputId === 'age' ? value : parseInt(document.getElementById('age').value) || 0,
      inputId === 'height' ? value : parseInt(document.getElementById('height').value) || 0,
      inputId === 'weight' ? value : parseInt(document.getElementById('weight').value) || 0
    );
    
    if (errors.length > 0 && input.value) {
      input.style.borderColor = '#e74c3c';
    } else {
      input.style.borderColor = '#ddd';
    }
  });
});
