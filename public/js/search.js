document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().slice(0, 10);

    const tabPanes = document.querySelectorAll('.tab-pane');

    tabPanes.forEach(pane => {
        const searchInput = pane.querySelector('.search-input');
        const dateFilter = pane.querySelector('.date-filter');
        const clearButton = pane.querySelector('.clear-filters');

        function applyFilter() {
            const keyword = searchInput?.value.toLowerCase() || '';
            const selectedDate = dateFilter?.value || '';

            // Table row filter
            const rows = pane.querySelectorAll('table tbody tr');
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                const rowDate = row.getAttribute('data-date');
                const matchesKeyword = rowText.includes(keyword);
                const matchesDate = selectedDate === '' || rowDate === selectedDate;
                row.style.display = matchesKeyword && matchesDate ? '' : 'none';
            });

            // Logs filter (for <li>)
            const logItems = pane.querySelectorAll('[data-raw]');
            logItems.forEach(item => {
                const raw = item.dataset.raw.toLowerCase();
                const matchesKeyword = raw.includes(keyword);
                const matchesDate = selectedDate === '' || raw.includes(selectedDate);
                item.style.display = matchesKeyword && matchesDate ? '' : 'none';
            });
        }

        // Event listeners
        if (searchInput) searchInput.addEventListener('input', applyFilter);
        if (dateFilter) dateFilter.addEventListener('change', applyFilter);

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (dateFilter) dateFilter.value = '';
                applyFilter();
            });
        }

        applyFilter(); // Apply filter on load
    });
});
