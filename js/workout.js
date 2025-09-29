// js/workout.js
import { showToast, formatTime } from './common.js';

let workouts = [];
let plan = [], currentExerciseIndex = 0, seconds = 0, timerId = null, running = false;
let totalElapsedTime = 0, exercisesCompleted = 0;

// Load workout data
fetch('data/workouts.json').then(r => r.json()).then(data => {
  workouts = data;
  console.log(`Loaded ${workouts.length} exercises`);
}).catch(error => {
  console.error('Error loading workouts:', error);
  showToast('Error loading workout database', 'error');
});

// DOM Elements
const form = document.getElementById('workoutForm');
const planEl = document.getElementById('plan');
const countdownPanel = document.getElementById('countdownPanel');
const exerciseName = document.getElementById('exerciseName');
const exerciseDescription = document.getElementById('exerciseDescription');
const exerciseInstructions = document.getElementById('exerciseInstructions');
const timerDisplay = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPause');
const skipBtn = document.getElementById('skipExercise');
const nextBtn = document.getElementById('nextExercise');
const exerciseCounter = document.getElementById('exerciseCounter');
const workoutProgress = document.getElementById('workoutProgress');
const progressRing = document.getElementById('progressRing');

// Stats elements
const totalTimeEl = document.getElementById('totalTime');
const exercisesCompletedEl = document.getElementById('exercisesCompleted');
const caloriesBurnedEl = document.getElementById('caloriesBurned');

// Timer ring configuration
const ringRadius = 90;
const ringCircumference = 2 * Math.PI * ringRadius;

// Initialize progress ring
if (progressRing) {
  progressRing.style.strokeDasharray = ringCircumference;
  progressRing.style.strokeDashoffset = ringCircumference;
}

// Form submission handler
form.addEventListener('submit', (e) => {
  e.preventDefault();
  generateWorkout();
});

function generateWorkout() {
  // Get selected body parts
  const selectedBodyParts = Array.from(document.querySelectorAll('input[name="bodyPart"]:checked'))
    .map(input => input.value);
  
  // Get selected equipment
  const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked'))
    .map(input => input.value);
  
  // Get difficulty and exercise count
  const difficulty = document.getElementById('difficulty').value;
  const exerciseCount = parseInt(document.getElementById('exerciseCount').value);
  
  // Validate selections
  if (selectedBodyParts.length === 0) {
    showToast('Please select at least one body part', 'error');
    return;
  }
  
  if (selectedEquipment.length === 0) {
    showToast('Please select at least one equipment option', 'error');
    return;
  }
  
  // Filter exercises based on criteria
  let filteredWorkouts = workouts.filter(workout => {
    const bodyPartMatch = selectedBodyParts.includes(workout.body);
    const equipmentMatch = selectedEquipment.includes(workout.equipment);
    const difficultyMatch = difficulty === 'any' || workout.difficulty === difficulty;
    
    return bodyPartMatch && equipmentMatch && difficultyMatch;
  });
  
  if (filteredWorkouts.length === 0) {
    showToast('No exercises found for your criteria. Try different options.', 'error');
    return;
  }
  
  // Generate random workout plan
  plan = [];
  const usedExercises = new Set();
  
  for (let i = 0; i < exerciseCount && filteredWorkouts.length > 0; i++) {
    let randomExercise;
    let attempts = 0;
    
    do {
      randomExercise = filteredWorkouts[Math.floor(Math.random() * filteredWorkouts.length)];
      attempts++;
    } while (usedExercises.has(randomExercise.id) && attempts < 50);
    
    if (!usedExercises.has(randomExercise.id)) {
      plan.push(randomExercise);
      usedExercises.add(randomExercise.id);
    } else {
      // If we can't find unique exercises, just add any exercise
      plan.push(randomExercise);
    }
  }
  
  if (plan.length === 0) {
    showToast('Could not generate workout plan', 'error');
    return;
  }
  
  renderPlan();
  startWorkout();
}

function renderPlan() {
  planEl.innerHTML = `
    <div class="plan-header">
      <h3>Your Workout Plan</h3>
      <p>${plan.length} exercises • ~${plan.reduce((total, ex) => total + ex.duration, 0)} seconds</p>
    </div>
    <div class="plan-exercises">
      ${plan.map((exercise, index) => `
        <div class="plan-item" data-index="${index}">
          <div class="plan-item-number">${index + 1}</div>
          <div class="plan-item-content">
            <h4>${exercise.name}</h4>
            <p class="plan-item-description">${exercise.description}</p>
            <div class="plan-item-meta">
              <span class="duration">${exercise.duration}s</span>
              <span class="difficulty">${exercise.difficulty}</span>
              <span class="equipment">${exercise.equipment === 'none' ? 'bodyweight' : exercise.equipment}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="start-workout-btn" onclick="startWorkout()">
      <span class="btn-icon">🚀</span>
      Start Workout
    </button>
  `;
  
  planEl.hidden = false;
}

function startWorkout() {
  currentExerciseIndex = 0;
  totalElapsedTime = 0;
  exercisesCompleted = 0;
  
  updateStats();
  showExercise(plan[currentExerciseIndex]);
  countdownPanel.hidden = false;
  
  // Scroll to countdown panel
  countdownPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  showToast('Workout started! Get ready!', 'success');
}

function showExercise(exercise) {
  exerciseName.textContent = exercise.name;
  exerciseDescription.textContent = exercise.description;
  exerciseInstructions.textContent = exercise.instructions;
  
  seconds = exercise.duration;
  timerDisplay.textContent = formatTime(seconds);
  
  // Update exercise counter
  exerciseCounter.textContent = `Exercise ${currentExerciseIndex + 1} of ${plan.length}`;
  
  // Update workout progress
  const progressPercentage = (currentExerciseIndex / plan.length) * 100;
  workoutProgress.style.width = `${progressPercentage}%`;
  
  // Reset timer state
  running = false;
  startPauseBtn.innerHTML = '<span class="btn-icon">▶️</span> Start';
  startPauseBtn.className = 'control-btn primary';
  
  // Reset progress ring
  updateProgressRing(100);
  
  // Highlight current exercise in plan
  document.querySelectorAll('.plan-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentExerciseIndex);
    item.classList.toggle('completed', index < currentExerciseIndex);
  });
}

function updateProgressRing(percentage) {
  if (!progressRing) return;
  
  const offset = ringCircumference - (percentage / 100) * ringCircumference;
  progressRing.style.strokeDashoffset = offset;
  
  // Change color based on progress
  if (percentage > 50) {
    progressRing.style.stroke = '#2faf6a';
  } else if (percentage > 20) {
    progressRing.style.stroke = '#f39c12';
  } else {
    progressRing.style.stroke = '#e74c3c';
  }
}

function startTimer() {
  if (seconds <= 0) return;
  
  running = true;
  startPauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
  startPauseBtn.className = 'control-btn pause';
  
  const totalDuration = plan[currentExerciseIndex].duration;
  
  timerId = setInterval(() => {
    seconds--;
    timerDisplay.textContent = formatTime(seconds);
    totalElapsedTime++;
    
    // Update progress ring
    const percentage = (seconds / totalDuration) * 100;
    updateProgressRing(percentage);
    
    // Visual feedback for last few seconds
    if (seconds <= 3 && seconds > 0) {
      timerDisplay.style.animation = 'pulse 0.5s ease-in-out';
      countdownPanel.style.animation = 'shake 0.5s ease-in-out';
    } else {
      timerDisplay.style.animation = '';
      countdownPanel.style.animation = '';
    }
    
    // Update stats
    updateStats();
    
    if (seconds <= 0) {
      completeExercise();
    }
  }, 1000);
}

function pauseTimer() {
  running = false;
  startPauseBtn.innerHTML = '<span class="btn-icon">▶️</span> Resume';
  startPauseBtn.className = 'control-btn primary';
  clearInterval(timerId);
}

function completeExercise() {
  clearInterval(timerId);
  running = false;
  exercisesCompleted++;
  
  // Visual completion feedback
  timerDisplay.style.animation = 'bounce 1s ease-in-out';
  showToast('Exercise completed! Great job!', 'success');
  
  // Auto-advance after a short delay
  setTimeout(() => {
    nextExercise();
  }, 2000);
}

function nextExercise() {
  clearInterval(timerId);
  currentExerciseIndex++;
  
  if (currentExerciseIndex >= plan.length) {
    finishWorkout();
  } else {
    showExercise(plan[currentExerciseIndex]);
  }
}

function skipExercise() {
  clearInterval(timerId);
  showToast('Exercise skipped', 'info');
  nextExercise();
}

function finishWorkout() {
  countdownPanel.hidden = true;
  
  // Calculate final stats
  const totalMinutes = Math.floor(totalElapsedTime / 60);
  const estimatedCalories = Math.round(exercisesCompleted * 12); // Rough estimate
  
  showToast(`Workout complete! 🎉 Time: ${totalMinutes}m, Calories: ~${estimatedCalories}`, 'success');
  
  // Save workout to localStorage
  const completedWorkout = {
    date: new Date().toISOString(),
    exercises: plan.map(ex => ex.name),
    duration: totalElapsedTime,
    exercisesCompleted: exercisesCompleted,
    estimatedCalories: estimatedCalories
  };
  
  const savedWorkouts = JSON.parse(localStorage.getItem('gb_completed_workouts') || '[]');
  savedWorkouts.push(completedWorkout);
  localStorage.setItem('gb_completed_workouts', JSON.stringify(savedWorkouts));
  
  // Reset for next workout
  resetWorkout();
}

function resetWorkout() {
  currentExerciseIndex = 0;
  totalElapsedTime = 0;
  exercisesCompleted = 0;
  plan = [];
  planEl.hidden = true;
  updateStats();
}

function updateStats() {
  const minutes = Math.floor(totalElapsedTime / 60);
  const secs = totalElapsedTime % 60;
  totalTimeEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
  exercisesCompletedEl.textContent = exercisesCompleted;
  caloriesBurnedEl.textContent = Math.round(exercisesCompleted * 12);
}

// Event listeners
startPauseBtn.addEventListener('click', () => {
  if (running) {
    pauseTimer();
  } else {
    startTimer();
  }
});

skipBtn.addEventListener('click', skipExercise);
nextBtn.addEventListener('click', nextExercise);

// Make startWorkout globally available
window.startWorkout = startWorkout;
