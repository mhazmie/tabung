window.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('cfchart').getContext('2d');
    const collected = parseFloat(document.getElementById('collectedvalue').value);
    const spent = parseFloat(document.getElementById('spentvalue').value);
    const available = parseFloat(document.getElementById('availablevalue').value);

    const total = collected + spent + available;

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Collected', 'Spent', 'Available'],
            datasets: [{
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => {
                        const percent = ((value / total) * 100).toFixed(1);
                        return `RM ${value.toFixed(2)}\n(${percent}%)`;
                    },
                    font: (context) => {
                        const width = context.chart.width;
                        return {
                            size: width < 400 ? 10 : 14
                        };
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const value = tooltipItem.raw;
                            const percent = ((value / total) * 100).toFixed(1);
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
});
