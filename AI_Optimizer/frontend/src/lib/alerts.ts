import Swal from 'sweetalert2';

// Estilos globales de SweetAlert2 adaptados al tema Bento Verde Minimalista
const bentoSwal = Swal.mixin({
  background: '#0a1b16',
  color: '#e3f3ee',
  confirmButtonColor: '#10b981',
  cancelButtonColor: '#243b35',
  customClass: {
    popup: 'bento-swal-popup',
    confirmButton: 'bento-swal-confirm',
    cancelButton: 'bento-swal-cancel',
  },
});

export const showToast = (title: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    icon,
    title,
    background: '#0a1b16',
    color: '#e3f3ee',
    iconColor: icon === 'success' ? '#10b981' : '#f59e0b',
  });
};

export const confirmAction = async (title: string, text: string, confirmText: string, cancelText: string): Promise<boolean> => {
  const result = await bentoSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    iconColor: '#34d399',
  });
  return result.isConfirmed;
};

export const showErrorAlert = (title: string, text: string, confirmButtonText: string = 'Entendido') => {
  return bentoSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText,
    iconColor: '#ef4444',
  });
};
