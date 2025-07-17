document.addEventListener('DOMContentLoaded', () => {
    const confirmForms = document.querySelectorAll('form[data-confirm]');

    confirmForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const msg = form.getAttribute('data-confirm');
            if (!confirm(msg)) {
                e.preventDefault();
            }
        });
    });
});
