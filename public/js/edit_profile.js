document.addEventListener('DOMContentLoaded', () => {
    const openProfileModal = document.getElementById('openEditProfileModal');
    if (openProfileModal) {
        openProfileModal.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
            modal.show();
        });
    }
});
