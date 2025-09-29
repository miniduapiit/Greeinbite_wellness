// js/mindfulness.js
import { showToast, formatTime } from './common.js';

// Global state
let breathingState = {
  isActive: false,
  isPaused: false,
  cycles: 0,
  pattern: '4-4-4',
  duration: 300, // 5 minutes default
  startTime: null,
  interval: null,
  phase: 0, // 0: inhale, 1: hold, 2: exhale, 3: hold (for box breathing)
  phaseStartTime: null
};

let timerState = {
  isActive: false,
  isPaused: false,
  type: 'meditation', // meditation, pomodoro, custom
  remaining: 0,
  total: 0,
  interval: null,
  pomodoroData: {
    currentCycle: 1,
    totalCycles: 4,
    isBreak: false,
    workDuration: 25,
    breakDuration: 5
  }
};

let audioState = {
  activeAudios: new Map(),
  volume: 0.5
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeBreathing();
  initializeTimer();
  initializeAmbientSounds();
  initializeSessionHistory();
});

// === BREATHING FUNCTIONALITY ===
function initializeBreathing() {
  const startBtn = document.getElementById('startBreath');
  const pauseBtn = document.getElementById('pauseBreath');
  const stopBtn = document.getElementById('stopBreath');
  const patternSelect = document.getElementById('breathPattern');
  const durationSelect = document.getElementById('breathDuration');

  startBtn.addEventListener('click', startBreathing);
  pauseBtn.addEventListener('click', pauseBreathing);
  stopBtn.addEventListener('click', stopBreathing);
  patternSelect.addEventListener('change', (e) => {
    breathingState.pattern = e.target.value;
  });
  durationSelect.addEventListener('change', (e) => {
    breathingState.duration = parseInt(e.target.value);
  });
}

function startBreathing() {
  if (breathingState.isPaused) {
    resumeBreathing();
    return;
  }

  breathingState.isActive = true;
  breathingState.isPaused = false;
  breathingState.cycles = 0;
  breathingState.startTime = Date.now();
  breathingState.phase = 0;
  breathingState.phaseStartTime = Date.now();

  updateBreathingButtons();
  document.getElementById('breathProgress').hidden = false;
  
  startBreathingAnimation();
  showToast('Breathing session started', 'success');
}

function pauseBreathing() {
  breathingState.isPaused = true;
  clearInterval(breathingState.interval);
  updateBreathingButtons();
  showToast('Breathing paused', 'info');
}

function resumeBreathing() {
  breathingState.isPaused = false;
  breathingState.phaseStartTime = Date.now();
  startBreathingAnimation();
  updateBreathingButtons();
  showToast('Breathing resumed', 'info');
}

function stopBreathing() {
  const sessionDuration = breathingState.startTime ? 
    Math.floor((Date.now() - breathingState.startTime) / 1000) : 0;
  
  breathingState.isActive = false;
  breathingState.isPaused = false;
  clearInterval(breathingState.interval);
  
  // Reset UI
  document.getElementById('breathCircle').style.transform = 'scale(1)';
  document.getElementById('breathText').textContent = 'Ready to begin';
  document.getElementById('breathInstructions').textContent = 'Click start to begin your breathing session';
  document.getElementById('breathProgress').hidden = true;
  updateBreathingButtons();
  
  // Record session if it was meaningful
  if (sessionDuration > 30) {
    recordSession('breathing', Math.floor(sessionDuration / 60), {
      cycles: breathingState.cycles,
      pattern: breathingState.pattern
    });
    showToast(`Breathing session completed: ${breathingState.cycles} cycles`, 'success');
  } else {
    showToast('Breathing session stopped', 'info');
  }
}

function startBreathingAnimation() {
  const patterns = {
    '4-4-4': [4, 4, 4],
    '4-7-8': [4, 7, 8],
    '6-2-6': [6, 2, 6],
    'box': [4, 4, 4, 4]
  };
  
  const currentPattern = patterns[breathingState.pattern];
  const circle = document.getElementById('breathCircle');
  const text = document.getElementById('breathText');
  const instructions = document.getElementById('breathInstructions');
  
  function nextPhase() {
    if (!breathingState.isActive || breathingState.isPaused) return;
    
    const phaseNames = breathingState.pattern === 'box' ? 
      ['Inhale', 'Hold', 'Exhale', 'Hold'] : 
      ['Inhale', 'Hold', 'Exhale'];
    
    const currentPhase = breathingState.phase;
    const phaseDuration = currentPattern[currentPhase] * 1000;
    
    // Update UI
    text.textContent = phaseNames[currentPhase];
    instructions.textContent = `${phaseNames[currentPhase]} for ${currentPattern[currentPhase]} seconds`;
    
    // Animate circle
    if (currentPhase === 0) { // Inhale
      circle.style.transform = 'scale(1.4)';
      circle.style.background = 'linear-gradient(135deg, rgba(47, 175, 106, 0.3), rgba(47, 175, 106, 0.1))';
    } else if (currentPhase === 2) { // Exhale
      circle.style.transform = 'scale(0.8)';
      circle.style.background = 'linear-gradient(135deg, rgba(47, 175, 106, 0.1), rgba(47, 175, 106, 0.05))';
    } else { // Hold
      // Keep current scale but change color slightly
      circle.style.background = 'linear-gradient(135deg, rgba(47, 175, 106, 0.2), rgba(47, 175, 106, 0.08))';
    }
    
    // Set transition duration
    circle.style.transition = `all ${currentPattern[currentPhase]}s ease-in-out`;
    
    // Schedule next phase
    setTimeout(() => {
      if (!breathingState.isActive || breathingState.isPaused) return;
      
      breathingState.phase = (breathingState.phase + 1) % currentPattern.length;
      
      // Complete cycle when we return to inhale
      if (breathingState.phase === 0) {
        breathingState.cycles++;
        updateBreathingProgress();
      }
      
      // Check if session should end
      if (breathingState.duration > 0) {
        const elapsed = (Date.now() - breathingState.startTime) / 1000;
        if (elapsed >= breathingState.duration) {
          stopBreathing();
          return;
        }
      }
      
      nextPhase();
    }, phaseDuration);
  }
  
  nextPhase();
}

function updateBreathingProgress() {
  const cyclesEl = document.getElementById('breathCycles');
  const timeLeftEl = document.getElementById('breathTimeLeft');
  const progressBar = document.getElementById('breathProgressBar');
  
  cyclesEl.textContent = `Cycles: ${breathingState.cycles}`;
  
  if (breathingState.duration > 0) {
    const elapsed = (Date.now() - breathingState.startTime) / 1000;
    const remaining = Math.max(0, breathingState.duration - elapsed);
    timeLeftEl.textContent = `Time: ${formatTime(remaining)}`;
    
    const progress = (elapsed / breathingState.duration) * 100;
    progressBar.style.width = `${Math.min(100, progress)}%`;
  } else {
    timeLeftEl.textContent = 'Time: Unlimited';
    progressBar.style.width = '100%';
  }
}

function updateBreathingButtons() {
  const startBtn = document.getElementById('startBreath');
  const pauseBtn = document.getElementById('pauseBreath');
  const stopBtn = document.getElementById('stopBreath');
  
  if (breathingState.isActive && !breathingState.isPaused) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
  } else if (breathingState.isActive && breathingState.isPaused) {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = false;
    startBtn.innerHTML = '<span class="btn-icon">▶️</span> Resume';
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-icon">🫁</span> Start Breathing';
  }
}

// === TIMER FUNCTIONALITY ===
function initializeTimer() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.dataset.type;
      switchTimerType(type);
    });
  });
  
  // Timer controls
  document.getElementById('startTimer').addEventListener('click', startTimer);
  document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
  document.getElementById('stopTimer').addEventListener('click', stopTimer);
  
  // Initialize progress ring
  const progressRing = document.getElementById('timerProgress');
  const circumference = 2 * Math.PI * 90;
  progressRing.style.strokeDasharray = circumference;
  progressRing.style.strokeDashoffset = circumference;
}

function switchTimerType(type) {
  timerState.type = type;
  
  // Update tab active state
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  // Show appropriate config panel
  document.querySelectorAll('.config-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`${type}Config`).classList.add('active');
  
  // Update timer display
  updateTimerDisplay();
}

function startTimer() {
  if (timerState.isPaused) {
    resumeTimer();
    return;
  }
  
  let duration = 0;
  
  switch (timerState.type) {
    case 'meditation':
      duration = parseInt(document.getElementById('meditationDuration').value) * 60;
      break;
    case 'pomodoro':
      setupPomodoroSession();
      duration = timerState.pomodoroData.workDuration * 60;
      break;
    case 'custom':
      duration = parseInt(document.getElementById('customMinutes').value) * 60;
      break;
  }
  
  timerState.isActive = true;
  timerState.isPaused = false;
  timerState.remaining = duration;
  timerState.total = duration;
  timerState.startTime = Date.now();
  
  updateTimerButtons();
  updateTimerDisplay();
  startTimerCountdown();
  
  showToast(`${timerState.type} session started`, 'success');
}

function pauseTimer() {
  timerState.isPaused = true;
  clearInterval(timerState.interval);
  updateTimerButtons();
  showToast('Timer paused', 'info');
}

function resumeTimer() {
  timerState.isPaused = false;
  startTimerCountdown();
  updateTimerButtons();
  showToast('Timer resumed', 'info');
}

function stopTimer() {
  const sessionDuration = timerState.startTime ? 
    Math.floor((Date.now() - timerState.startTime) / 1000) : 0;
  
  timerState.isActive = false;
  timerState.isPaused = false;
  clearInterval(timerState.interval);
  
  updateTimerButtons();
  updateTimerDisplay();
  
  // Record session if meaningful
  if (sessionDuration > 30) {
    recordSession(timerState.type, Math.floor(sessionDuration / 60), {
      completed: false,
      originalDuration: Math.floor(timerState.total / 60)
    });
    showToast('Session stopped and recorded', 'info');
  } else {
    showToast('Session stopped', 'info');
  }
}

function startTimerCountdown() {
  timerState.interval = setInterval(() => {
    if (timerState.isPaused) return;
    
    timerState.remaining--;
    updateTimerDisplay();
    updateTimerProgress();
    
    if (timerState.remaining <= 0) {
      completeTimerSession();
    }
  }, 1000);
}

function completeTimerSession() {
  clearInterval(timerState.interval);
  
  if (timerState.type === 'pomodoro') {
    handlePomodoroCompletion();
  } else {
    // Complete regular session
    timerState.isActive = false;
    updateTimerButtons();
    
    recordSession(timerState.type, Math.floor(timerState.total / 60), {
      completed: true
    });
    
    showToast('Session completed! Well done! 🎉', 'success');
    document.getElementById('timerLabel').textContent = 'Completed!';
  }
}

function setupPomodoroSession() {
  timerState.pomodoroData = {
    currentCycle: 1,
    totalCycles: parseInt(document.getElementById('pomodoroCycles').value),
    isBreak: false,
    workDuration: parseInt(document.getElementById('pomodoroWork').value),
    breakDuration: parseInt(document.getElementById('pomodoroBreak').value)
  };
  
  document.getElementById('pomodoroStatus').hidden = false;
  updatePomodoroDisplay();
}

function handlePomodoroCompletion() {
  const pomodoro = timerState.pomodoroData;
  
  if (!pomodoro.isBreak) {
    // Work session completed, start break
    pomodoro.isBreak = true;
    timerState.remaining = pomodoro.breakDuration * 60;
    timerState.total = pomodoro.breakDuration * 60;
    updatePomodoroDisplay();
    showToast('Work session complete! Break time! 🎉', 'success');
    startTimerCountdown();
  } else {
    // Break completed
    pomodoro.isBreak = false;
    pomodoro.currentCycle++;
    
    if (pomodoro.currentCycle > pomodoro.totalCycles) {
      // All cycles completed
      timerState.isActive = false;
      updateTimerButtons();
      document.getElementById('pomodoroStatus').hidden = true;
      
      recordSession('pomodoro', pomodoro.totalCycles * (pomodoro.workDuration + pomodoro.breakDuration), {
        cycles: pomodoro.totalCycles,
        completed: true
      });
      
      showToast('Pomodoro session completed! Excellent work! 🍅', 'success');
    } else {
      // Start next work session
      timerState.remaining = pomodoro.workDuration * 60;
      timerState.total = pomodoro.workDuration * 60;
      updatePomodoroDisplay();
      showToast('Break complete! Back to work!', 'success');
      startTimerCountdown();
    }
  }
}

function updatePomodoroDisplay() {
  const pomodoro = timerState.pomodoroData;
  document.getElementById('currentCycle').textContent = `Cycle ${pomodoro.currentCycle} of ${pomodoro.totalCycles}`;
  document.getElementById('sessionType').textContent = pomodoro.isBreak ? 'Break Time' : 'Work Session';
}

function updateTimerDisplay() {
  const display = document.getElementById('sessionTimer');
  const label = document.getElementById('timerLabel');
  
  if (timerState.isActive) {
    display.textContent = formatTime(timerState.remaining);
    label.textContent = timerState.isPaused ? 'Paused' : 'Active';
  } else {
    // Show default time based on selected type
    let defaultTime = 300; // 5 minutes
    
    switch (timerState.type) {
      case 'meditation':
        defaultTime = parseInt(document.getElementById('meditationDuration').value) * 60;
        break;
      case 'pomodoro':
        defaultTime = parseInt(document.getElementById('pomodoroWork').value) * 60;
        break;
      case 'custom':
        defaultTime = parseInt(document.getElementById('customMinutes').value) * 60;
        break;
    }
    
    display.textContent = formatTime(defaultTime);
    label.textContent = 'Ready';
  }
}

function updateTimerProgress() {
  const progressRing = document.getElementById('timerProgress');
  const circumference = 2 * Math.PI * 90;
  const progress = (timerState.total - timerState.remaining) / timerState.total;
  const offset = circumference - (progress * circumference);
  
  progressRing.style.strokeDashoffset = offset;
  
  // Change color based on progress
  if (progress < 0.5) {
    progressRing.style.stroke = '#2faf6a';
  } else if (progress < 0.8) {
    progressRing.style.stroke = '#f39c12';
  } else {
    progressRing.style.stroke = '#e74c3c';
  }
}

function updateTimerButtons() {
  const startBtn = document.getElementById('startTimer');
  const pauseBtn = document.getElementById('pauseTimer');
  const stopBtn = document.getElementById('stopTimer');
  
  if (timerState.isActive && !timerState.isPaused) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
  } else if (timerState.isActive && timerState.isPaused) {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = false;
    startBtn.innerHTML = '<span class="btn-icon">▶️</span> Resume';
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Session';
  }
}

// === AMBIENT SOUNDS ===
function initializeAmbientSounds() {
  // Sound toggles
  document.querySelectorAll('.sound-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const soundType = e.target.dataset.sound;
      toggleSound(soundType, e.target);
    });
  });
  
  // Volume control
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  
  volumeSlider.addEventListener('input', (e) => {
    audioState.volume = e.target.value / 100;
    volumeValue.textContent = `${e.target.value}%`;
    
    // Update volume for all active sounds
    audioState.activeAudios.forEach(audio => {
      audio.volume = audioState.volume;
    });
  });
  
  // Stop all sounds
  document.getElementById('stopAllSounds').addEventListener('click', stopAllSounds);
}

function toggleSound(soundType, button) {
  if (audioState.activeAudios.has(soundType)) {
    // Stop sound
    const audio = audioState.activeAudios.get(soundType);
    audio.pause();
    audioState.activeAudios.delete(soundType);
    button.textContent = 'Play';
    button.classList.remove('active');
  } else {
    // Start sound - create audio with data URL for demonstration
    const audio = createAmbientAudio(soundType);
    audio.volume = audioState.volume;
    audio.loop = true;
    
    audio.play().then(() => {
      audioState.activeAudios.set(soundType, audio);
      button.textContent = 'Stop';
      button.classList.add('active');
    }).catch(err => {
      console.log('Audio play failed:', err);
      showToast('Audio playback not available in this environment', 'info');
    });
  }
}

function createAmbientAudio(soundType) {
  // Create a simple tone for demonstration since we can't load external audio files
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Different frequencies for different "sounds"
  const frequencies = {
    rain: 200,
    ocean: 150,
    forest: 300,
    birds: 800,
    fire: 100,
    wind: 250
  };
  
  oscillator.frequency.setValueAtTime(frequencies[soundType] || 200, audioContext.currentTime);
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Create a mock audio object
  const mockAudio = {
    play: () => {
      oscillator.start();
      return Promise.resolve();
    },
    pause: () => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    },
    set volume(val) {
      gainNode.gain.setValueAtTime(val * 0.1, audioContext.currentTime);
    },
    loop: true
  };
  
  return mockAudio;
}

function stopAllSounds() {
  audioState.activeAudios.forEach((audio, soundType) => {
    audio.pause();
    const button = document.querySelector(`[data-sound="${soundType}"]`);
    if (button) {
      button.textContent = 'Play';
      button.classList.remove('active');
    }
  });
  audioState.activeAudios.clear();
  showToast('All sounds stopped', 'info');
}

// === SESSION HISTORY ===
function initializeSessionHistory() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      setHistoryFilter(filter);
    });
  });
  
  // Action buttons - removed since HTML elements don't exist
  
  // Load and display sessions
  loadSessionHistory();
}

function recordSession(type, minutes, metadata = {}) {
  const session = {
    id: Date.now(),
    type: type,
    duration: minutes,
    date: new Date().toISOString(),
    metadata: metadata
  };
  
  const sessions = JSON.parse(localStorage.getItem('gb_mindfulness_sessions') || '[]');
  sessions.push(session);
  localStorage.setItem('gb_mindfulness_sessions', JSON.stringify(sessions));
  
  loadSessionHistory();
}

function loadSessionHistory() {
  const sessions = JSON.parse(localStorage.getItem('gb_mindfulness_sessions') || '[]');
  updateStatsOverview(sessions);
  renderSessionsList(sessions);
}

function updateStatsOverview(sessions) {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  
  // Calculate streak
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let currentStreak = 0;
  
  if (sessions.some(s => new Date(s.date).toDateString() === today)) {
    currentStreak = 1;
    // Count consecutive days backwards
    for (let i = 1; i < 365; i++) {
      const checkDate = new Date(Date.now() - i * 86400000).toDateString();
      if (sessions.some(s => new Date(s.date).toDateString() === checkDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // This week sessions
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeek = sessions.filter(s => new Date(s.date) >= weekStart).length;
  
  document.getElementById('totalSessions').textContent = totalSessions;
  document.getElementById('totalMinutes').textContent = totalMinutes;
  document.getElementById('currentStreak').textContent = currentStreak;
  document.getElementById('thisWeek').textContent = thisWeek;
}

function renderSessionsList(sessions, filter = 'all') {
  const container = document.getElementById('sessionsList');
  
  let filteredSessions = sessions;
  if (filter !== 'all') {
    filteredSessions = sessions.filter(s => s.type === filter);
  }
  
  // Sort by date, newest first
  filteredSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (filteredSessions.length === 0) {
    container.innerHTML = '<div class="no-sessions">No sessions found</div>';
    return;
  }
  
  container.innerHTML = filteredSessions.map(session => {
    const date = new Date(session.date);
    const typeIcon = {
      breathing: '🫁',
      meditation: '🧘',
      pomodoro: '🍅',
      custom: '⏱️'
    };
    
    return `
      <div class="session-item">
        <div class="session-icon">${typeIcon[session.type] || '⏱️'}</div>
        <div class="session-details">
          <div class="session-type">${session.type.charAt(0).toUpperCase() + session.type.slice(1)}</div>
          <div class="session-duration">${session.duration} minutes</div>
          <div class="session-date">${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
          ${session.metadata.cycles ? `<div class="session-meta">Cycles: ${session.metadata.cycles}</div>` : ''}
          ${session.metadata.pattern ? `<div class="session-meta">Pattern: ${session.metadata.pattern}</div>` : ''}
        </div>
        <div class="session-status">
          ${session.metadata.completed !== false ? '✅' : '⚠️'}
        </div>
      </div>
    `;
  }).join('');
}

function setHistoryFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  const sessions = JSON.parse(localStorage.getItem('gb_mindfulness_sessions') || '[]');
  renderSessionsList(sessions, filter);
}
