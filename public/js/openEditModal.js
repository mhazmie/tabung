document.addEventListener('DOMContentLoaded', () => {
    const editButtons = document.querySelectorAll('.edit-btn');

    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.getAttribute('data-user-id');

            try {
                const res = await fetch(`/api/users/${userId}`);
                const data = await res.json();

                document.getElementById('edit-id').value = data.users_id;
                document.getElementById('edit-username').value = data.username;
                document.getElementById('edit-nickname').value = data.nickname;
                document.getElementById('edit-password').value = '';
                document.getElementById('edit-role').value = data.roles_id;
                document.getElementById('editform').action = `/users/edit/${data.users_id}`;

                const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                modal.show();
            } catch (err) {
                console.error('Failed to load user info:', err);
            }
        });
    });
});
