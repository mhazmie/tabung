document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().slice(0, 10);

    // Loop through each tab-pane
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabPanes.forEach(pane => {
        const searchInput = pane.querySelector('.search-input');
        const dateFilter = pane.querySelector('.date-filter');

        // Set default value to today
        // if (dateFilter) {
        //     dateFilter.value = today;
        // }

        function applyFilter() {
            const keyword = searchInput?.value.toLowerCase() || '';
            const selectedDate = dateFilter?.value || '';

            const rows = pane.querySelectorAll('table tbody tr');

            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                const rowDate = row.getAttribute('data-date'); // in YYYY-MM-DD

                const matchesKeyword = rowText.includes(keyword);
                const matchesDate = selectedDate === '' || rowDate === selectedDate;

                row.style.display = matchesKeyword && matchesDate ? '' : 'none';
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', applyFilter);
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', applyFilter);
        }

        // Initial filter on load
        applyFilter();
    });
});