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
            console.log(`🛠️ [EditModal] Edit button clicked for user ID: ${userId}`);
            try {
                const res = await fetch(`/api/users/${userId}`);

                if (!res.ok) {
                    console.error(`❌ [EditModal] Server responded with status ${res.status} for user ID: ${userId}`);
                    return;
                }
                const data = await res.json();
                console.log(`✅ [EditModal] User data retrieved for user ID: ${userId}`, data);
                
                // Populate modal form fields
                document.getElementById('edit-id').value = data.users_id;
                document.getElementById('edit-username').value = data.username;
                document.getElementById('edit-nickname').value = data.nickname;
                document.getElementById('edit-password').value = '';
                document.getElementById('edit-role').value = data.roles_id;
                document.getElementById('editform').action = `/users/edit/${data.users_id}`;

                // Display the modal
                const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                modal.show();
                console.log(`🪟 [EditModal] Edit modal displayed for user: ${data.username} (ID: ${data.users_id})`);
            } catch (err) {
                console.error(`❌ [EditModal] Failed to fetch user data for ID: ${userId}`, err);
            }
        });
    });
});