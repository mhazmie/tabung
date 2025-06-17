window.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('cfchart').getContext('2d');
  const collected = parseFloat(document.getElementById('collectedvalue').value);
  const spent = parseFloat(document.getElementById('spentvalue').value);
  const available = parseFloat(document.getElementById('availablevalue').value);

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
        plugins: {
            datalabels: {
                color: '#fff',
                formatter: (value, context) => {
                    const label = context.chart.data.labels[context.dataIndex];
                    return `RM ${value}`;
                },
                font: {
                    size: 14
                },
            },
            legend: {
                labels: {
                    color: '#fff',
                }
            }
        }
    },
    plugins: [ChartDataLabels]
  });
});
