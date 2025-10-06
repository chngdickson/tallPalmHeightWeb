export function loadFooter() {
  fetch('../src/content/partials/footer.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('footer').innerHTML = data;
          initFooterInteractions();
      })
      .catch(error => console.error('Error loading footer:', error));
}

function initFooterInteractions() {
  // Initialize any footer-specific interactions
  const currentYear = new Date().getFullYear();
  const yearElement = document.querySelector('.current-year');
  
  if (yearElement) {
      yearElement.textContent = currentYear;
  }
}