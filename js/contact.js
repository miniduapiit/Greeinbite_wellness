// Enhanced Contact Form with Validation
import { showToast } from './common.js';

// Form elements
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('cName');
const emailInput = document.getElementById('cEmail');
const messageInput = document.getElementById('cMessage');
const submitBtn = form.querySelector('.submit-btn');
const confirmationDiv = document.getElementById('confirmationMessage');
const sendAnotherBtn = document.getElementById('sendAnother');

// Error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const messageError = document.getElementById('messageError');

// Character counter
const charCount = document.getElementById('charCount');
const charCounter = document.querySelector('.char-counter');

// Validation state
let formValid = {
  name: false,
  email: false,
  message: false
};

// Initialize form
function initializeForm() {
  // Real-time validation
  nameInput.addEventListener('input', validateName);
  nameInput.addEventListener('blur', validateName);
  
  emailInput.addEventListener('input', validateEmail);
  emailInput.addEventListener('blur', validateEmail);
  
  messageInput.addEventListener('input', validateMessage);
  messageInput.addEventListener('blur', validateMessage);
  
  // Character counter for message
  messageInput.addEventListener('input', updateCharCounter);
  
  // Form submission
  form.addEventListener('submit', handleSubmit);
  
  // Send another message button
  sendAnotherBtn.addEventListener('click', resetForm);
  
  // Initialize character counter
  updateCharCounter();
}

// Validation functions
function validateName() {
  const name = nameInput.value.trim();
  const minLength = 2;
  const maxLength = 100;
  
  // Clear previous state
  nameError.textContent = '';
  nameInput.classList.remove('error', 'valid');
  
  if (!name) {
    if (nameInput === document.activeElement || nameInput.dataset.touched) {
      showFieldError(nameInput, nameError, 'Name is required');
      formValid.name = false;
      return;
    }
  } else if (name.length < minLength) {
    showFieldError(nameInput, nameError, `Name must be at least ${minLength} characters`);
    formValid.name = false;
    return;
  } else if (name.length > maxLength) {
    showFieldError(nameInput, nameError, `Name must be less than ${maxLength} characters`);
    formValid.name = false;
    return;
  } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    showFieldError(nameInput, nameError, 'Name can only contain letters, spaces, hyphens, and apostrophes');
    formValid.name = false;
    return;
  }
  
  // Valid name
  nameInput.classList.add('valid');
  nameInput.dataset.touched = 'true';
  formValid.name = true;
  updateSubmitButton();
}

function validateEmail() {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Clear previous state
  emailError.textContent = '';
  emailInput.classList.remove('error', 'valid');
  
  if (!email) {
    if (emailInput === document.activeElement || emailInput.dataset.touched) {
      showFieldError(emailInput, emailError, 'Email is required');
      formValid.email = false;
      return;
    }
  } else if (!emailRegex.test(email)) {
    showFieldError(emailInput, emailError, 'Please enter a valid email address');
    formValid.email = false;
    return;
  } else if (email.length > 255) {
    showFieldError(emailInput, emailError, 'Email address is too long');
    formValid.email = false;
    return;
  }
  
  // Valid email
  emailInput.classList.add('valid');
  emailInput.dataset.touched = 'true';
  formValid.email = true;
  updateSubmitButton();
}

function validateMessage() {
  const message = messageInput.value.trim();
  const minLength = 10;
  const maxLength = 1000;
  
  // Clear previous state
  messageError.textContent = '';
  messageInput.classList.remove('error', 'valid');
  
  if (!message) {
    if (messageInput === document.activeElement || messageInput.dataset.touched) {
      showFieldError(messageInput, messageError, 'Message is required');
      formValid.message = false;
      return;
    }
  } else if (message.length < minLength) {
    showFieldError(messageInput, messageError, `Message must be at least ${minLength} characters`);
    formValid.message = false;
    return;
  } else if (message.length > maxLength) {
    showFieldError(messageInput, messageError, `Message must be less than ${maxLength} characters`);
    formValid.message = false;
    return;
  }
  
  // Valid message
  messageInput.classList.add('valid');
  messageInput.dataset.touched = 'true';
  formValid.message = true;
  updateSubmitButton();
}

function showFieldError(input, errorElement, message) {
  input.classList.add('error');
  errorElement.textContent = message;
  input.dataset.touched = 'true';
}

function updateCharCounter() {
  const currentLength = messageInput.value.length;
  const maxLength = 1000;
  
  charCount.textContent = currentLength;
  
  // Update counter styling based on usage
  charCounter.classList.remove('warning', 'danger');
  
  if (currentLength > maxLength * 0.9) {
    charCounter.classList.add('danger');
  } else if (currentLength > maxLength * 0.75) {
    charCounter.classList.add('warning');
  }
}

function updateSubmitButton() {
  const isFormValid = formValid.name && formValid.email && formValid.message;
  submitBtn.disabled = !isFormValid;
}

// Form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  // Mark all fields as touched for validation
  nameInput.dataset.touched = 'true';
  emailInput.dataset.touched = 'true';
  messageInput.dataset.touched = 'true';
  
  // Validate all fields
  validateName();
  validateEmail();
  validateMessage();
  
  // Check if form is valid
  if (!formValid.name || !formValid.email || !formValid.message) {
    showToast('Please fix the errors above', 'error');
    return;
  }
  
  // Show loading state
  setLoadingState(true);
  
  try {
    // Simulate form submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get form data
    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      timestamp: new Date().toISOString(),
      id: generateId()
    };
    
    // Store in localStorage
    saveToLocalStorage(formData);
    
    // Show success state
    showSuccessMessage();
    showToast('Message sent successfully!', 'success');
    
  } catch (error) {
    showToast('There was an error sending your message. Please try again.', 'error');
    console.error('Form submission error:', error);
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  
  if (isLoading) {
    submitBtn.disabled = true;
    btnText.hidden = true;
    btnLoading.hidden = false;
  } else {
    submitBtn.disabled = !formValid.name || !formValid.email || !formValid.message;
    btnText.hidden = false;
    btnLoading.hidden = true;
  }
}

function saveToLocalStorage(formData) {
  try {
    const existingFeedback = JSON.parse(localStorage.getItem('gb_feedback') || '[]');
    existingFeedback.push(formData);
    localStorage.setItem('gb_feedback', JSON.stringify(existingFeedback));
    
    // Also save latest submission details
    localStorage.setItem('gb_last_submission', JSON.stringify({
      ...formData,
      submittedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save feedback');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showSuccessMessage() {
  form.style.display = 'none';
  confirmationDiv.classList.remove('hidden');
  confirmationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  // Reset form
  form.reset();
  
  // Clear validation states
  [nameInput, emailInput, messageInput].forEach(input => {
    input.classList.remove('error', 'valid');
    input.dataset.touched = 'false';
  });
  
  // Clear error messages
  nameError.textContent = '';
  emailError.textContent = '';
  messageError.textContent = '';
  
  // Reset validation state
  formValid = { name: false, email: false, message: false };
  
  // Update character counter
  updateCharCounter();
  
  // Update submit button
  updateSubmitButton();
  
  // Show form, hide confirmation
  form.style.display = 'block';
  confirmationDiv.classList.add('hidden');
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Focus first field
  nameInput.focus();
}

// Initialize form functionality immediately
initializeForm();
