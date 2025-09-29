// js/footer.js
// Shared footer functionality

export function initializeFooter() {
  // Set current year
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Handle footer newsletter subscription
  const footerNewsletterForm = document.getElementById('footerNewsletterForm');
  if (footerNewsletterForm) {
    footerNewsletterForm.addEventListener('submit', handleFooterNewsletter);
  }
}

function handleFooterNewsletter(e) {
  e.preventDefault();
  
  // Import showToast dynamically
  import('./common.js').then(({ showToast }) => {
    const email = document.getElementById('footerNewsEmail').value.trim();
    
    if(!/^\S+@\S+\.\S+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    
    const list = JSON.parse(localStorage.getItem('gb_newsletter_subscribers') || '[]');
    const subscriber = {
      email: email,
      subscriptionDate: new Date().toISOString(),
      source: 'footer'
    };
    
    // Check if email already exists
    const existingSubscriber = list.find(sub => sub.email === email);
    if(existingSubscriber) {
      showToast('You\'re already subscribed to our newsletter!', 'info');
      return;
    }
    
    // Add new subscriber
    list.push(subscriber);
    localStorage.setItem('gb_newsletter_subscribers', JSON.stringify(list));
    showToast('🎉 Welcome to GreenBite! Check your email for a confirmation.', 'success');
    document.getElementById('footerNewsletterForm').reset();
  });
}

// Generate footer HTML
export function getFooterHTML() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <!-- Quick Links -->
          <div class="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="recipes.html">Healthy Recipes</a></li>
              <li><a href="calculator.html">Calorie Calculator</a></li>
              <li><a href="workout.html">Workout Plans</a></li>
              <li><a href="mindfulness.html">Mindfulness</a></li>
              <li><a href="contact.html">Contact Us</a></li>
            </ul>
          </div>

          <!-- Health Resources -->
          <div class="footer-section">
            <h3>Health Resources</h3>
            <ul>
              <li><a href="#nutrition-tips">Nutrition Tips</a></li>
              <li><a href="#meal-planning">Meal Planning</a></li>
              <li><a href="#fitness-guides">Fitness Guides</a></li>
              <li><a href="#wellness-blog">Wellness Blog</a></li>
              <li><a href="#health-tracker">Health Tracker</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div class="footer-section">
            <h3>Support</h3>
            <ul>
              <li><a href="contact.html">Help Center</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#community">Community Guidelines</a></li>
            </ul>
          </div>

          <!-- Newsletter Subscription -->
          <div class="footer-section">
            <div class="footer-newsletter">
              <h3>Stay Updated</h3>
              <p>Get weekly health tips, recipes, and wellness insights delivered to your inbox.</p>
              <form id="footerNewsletterForm" class="footer-newsletter-form">
                <input type="email" id="footerNewsEmail" placeholder="Enter your email" required />
                <button type="submit">Subscribe</button>
              </form>
              <div class="footer-social">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="YouTube">📺</a>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© <span id="year"></span> GreenBite — Empowering your wellness journey. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}