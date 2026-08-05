import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// 1. Blood Group Pie Chart
export const BloodGroupPieChart = ({ data = {} }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Destroy previous instance
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: [
            '#d32f2f', '#dc3545', '#ff4d4d', '#ff7373',
            '#ffa6a6', '#ffc4c4', '#e60000', '#990000'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};


// 2. Monthly Donation Bar Chart
export const MonthlyDonationBarChart = ({ data = {} }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Completed Donations',
          data: Object.values(data),
          backgroundColor: '#d32f2f',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};


// 3. Request Status Doughnut Chart
export const RequestStatusDoughnutChart = ({ data = {} }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: ['#ffc107', '#0dcaf0', '#198754', '#dc3545'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};


// 4. City Wise Donation Chart
export const CityWiseDonationChart = ({ data = {} }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Donors',
          data: Object.values(data),
          backgroundColor: '#495057',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', // horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } }
          },
          y: {
            ticks: { font: { size: 10 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
