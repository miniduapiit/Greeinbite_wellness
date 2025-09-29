// js/home.js
const slogans = [
  "Transform your health with sustainable lifestyle choices",
  "Every small step counts towards your wellness journey",
  "Nourish your body, feed your soul, live your best life",
  "Where healthy habits meet delicious experiences",
  "Your wellness journey starts with a single choice"
];

// auto-rotate slogans
let idx = 0;
const rotEl = document.getElementById('rotating-slogan');
function rotateSlogan(){ 
  rotEl.style.opacity = '0';
  setTimeout(() => {
    rotEl.textContent = slogans[idx % slogans.length];
    rotEl.style.opacity = '1';
    idx++;
  }, 300);
}

// Initialize and set rotation
rotEl.style.transition = 'opacity 0.3s ease';
rotateSlogan(); 
setInterval(rotateSlogan, 5000);

// Enhanced daily tips with more variety
const tips = {
  '2025-09-22': "Start your day with a glass of water and 5 minutes of stretching",
  '2025-09-21': "Try adding one extra serving of vegetables to your lunch today",
  '2025-09-20': "Take a 10-minute walk after meals to aid digestion",
  'default': "Practice mindful eating — chew slowly and savor each bite"
};

const today = new Date().toISOString().slice(0,10);
const tipElement = document.getElementById('daily-tip');
tipElement.textContent = tips[today] || tips['default'];
