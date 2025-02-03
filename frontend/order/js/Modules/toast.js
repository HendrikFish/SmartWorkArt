// public/js/Modules/toast.js

export function showToast(message, isSuccess = true) {
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
      existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.color = 'white';
  toast.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
  toast.style.zIndex = '1000';
  toast.style.transition = 'opacity 0.5s ease-in-out';

  document.body.appendChild(toast);

  setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
          toast.remove();
      }, 500);
  }, 2000);
}
