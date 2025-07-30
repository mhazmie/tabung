document.addEventListener('DOMContentLoaded', () => {
    const editButtons = document.querySelectorAll('.edit-btn');
    if (!editButtons.length) {
        console.warn('⚠️ No edit buttons found. Make sure elements have the class `.edit-btn`.');
    }
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.getAttribute('data-user-id');
            if (!userId) {
                console.warn('⚠️ Edit button clicked without a data-user-id attribute.');
                return;
            }
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (!res.ok) {
                    return;
                }
                const data = await res.json();

                // Populate modal form fields
                document.getElementById('edit-id').value = data.users_id;
                document.getElementById('admin-edit-username').value = data.username;
                document.getElementById('admin-edit-nickname').value = data.nickname;
                document.getElementById('admin-edit-password').value = '';
                document.getElementById('admin-edit-type').value = data.type_id;
                document.getElementById('admin-edit-role').value = data.roles_id;
                document.getElementById('editform').action = `/admin/user/update`;

                // Display the modal
                const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                modal.show();
            } catch (err) {
                console.error(`❌ [EditModal] Failed to fetch user data for ID: ${userId}`, err);
            }
        });
    });
});