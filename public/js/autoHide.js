document.addEventListener('DOMContentLoaded', function () {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.forEach(function (toastEl) {
        const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
        toast.show();
    });
});