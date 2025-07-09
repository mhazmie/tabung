function openEditModal(id) {
    fetch(`/api/users/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('edit-id').value = data.users_id;
            document.getElementById('edit-username').value = data.username;
            document.getElementById('edit-nickname').value = data.nickname;
            document.getElementById('edit-password').value = '';
            document.getElementById('edit-role').value = data.roles_id;
            document.getElementById('editform').action = `/users/edit/${data.users_id}`;

            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        });
}