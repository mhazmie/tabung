const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('keyup', function () {
    const filter = searchInput.value.toLowerCase();
    const activeTab = document.querySelector('.tab-pane.show.active'); // Bootstrap active tab
    const rows = activeTab.querySelectorAll('table tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});