window.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('cfchart')?.getContext('2d');
    if (!ctx) {
        console.error('❌ Chart context not found. Ensure <canvas id="cfchart"> exists.');
        return;
    }

    const collectedEl = document.getElementById('collectedvalue');
    const spentEl = document.getElementById('spentvalue');
    const availableEl = document.getElementById('availablevalue');

    if (!collectedEl || !spentEl || !availableEl) {
        console.error('❌ One or more value elements are missing.');
        return;
    }

    const collected = parseFloat(collectedEl.value);
    const spent = parseFloat(spentEl.value);
    const available = parseFloat(availableEl.value);

    console.log('📊 Raw values:', { collected, spent, available });

    const total = collected + spent + available;

    if (isNaN(collected) || isNaN(spent) || isNaN(available)) {
        console.warn('⚠️ Some of the chart data is not a number. Check hidden inputs.');
    }

    if (total === 0) {
        console.warn('⚠️ Total is 0 — chart may appear empty.');
    }

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
                        return `RM ${value.toFixed(0)}`;
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
                            return `RM ${value} (${percent}%)`;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    console.log('✅ Chart initialized successfully.');
});