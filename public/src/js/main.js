// Import components
import { loadHeader } from './bodies/header.js';
import { loadFooter } from './bodies/footer.js';

// Initialize the site
document.addEventListener('DOMContentLoaded', () => {
    // Load partials
    loadHeader();
    loadFooter();
    
    // Setup form validation
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', validateForm);
    }
    
    console.log('Site initialized successfully');
});

// document.addEventListener('DOMContentLoaded', function() {
//     const browseBtn = document.getElementById('browse-btn');
//     browseBtn.addEventListener('click', () => {
//         fileInput.click();
//     });
// });