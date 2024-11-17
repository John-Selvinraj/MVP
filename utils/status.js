export function updateStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}