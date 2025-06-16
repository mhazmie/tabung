window.addEventListener('DOMContentLoaded', () => {
    var ctx = document.getElementById('cfchart').getContext('2d');

    // These values will be injected from inline <script> in EJS
    var collected = parseFloat(document.getElementById('collectedVal').value);
    var spent = parseFloat(document.getElementById('spentVal').value);
    var available = parseFloat(document.getElementById('availableVal').value);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Collected', 'Spent', 'Available'],
            datasets: [{
                label: 'Amount (RM)',
                data: [collected, spent, available],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
});
