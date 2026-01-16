"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function LeaveTypeChart({ data, title = "Leave Requests by Type" }) {
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.8)');
  const [gridColor, setGridColor] = useState('rgba(0, 0, 0, 0.1)');
  
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTextColor(isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)');
      setGridColor(isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
    };
    
    updateColors();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leave data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.map(d => d.type),
    datasets: [
      {
        label: 'Total Requests',
        data: data.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(251, 146, 60, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = data.reduce((sum, d) => sum + d.count, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.y} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          stepSize: 1,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
