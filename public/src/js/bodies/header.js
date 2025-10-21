export function loadHeader() {
  fetch('./src/content/partials/header.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('header').innerHTML = data;
          initMobileMenu();
      })
      .catch(error => console.error('Error loading header:', error));
}

function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  
  if (menuBtn && navMenu) {
      menuBtn.addEventListener('click', () => {
          navMenu.classList.toggle('active');
      });
  }
}