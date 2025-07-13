
const searchInput = document.getElementById('searchInput');
const logItems = document.querySelectorAll('#logList li');
const logDateFilter = document.getElementById('logDateFilter');

// Default to today’s date
const today = new Date().toISOString().slice(0, 10);
logDateFilter.value = today;

function filterLogs() {
    const keyword = searchInput.value.toLowerCase();
    const selectedDate = logDateFilter.value;

    logItems.forEach(item => {
        const raw = item.dataset.raw;
        const visible = raw.includes(selectedDate) && raw.toLowerCase().includes(keyword);
        item.style.display = visible ? '' : 'none';
    });
}

searchInput.addEventListener('keyup', filterLogs);
logDateFilter.addEventListener('change', filterLogs);

