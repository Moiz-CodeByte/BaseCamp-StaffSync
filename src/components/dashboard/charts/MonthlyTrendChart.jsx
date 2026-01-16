"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MonthlyTrendChart({ data, title = "Monthly Leave Trends" }) {
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
            <TrendingUp className="w-5 h-5 text-teal-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trend data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Approved',
        data: data.map(d => d.approved),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Pending',
        data: data.map(d => d.pending),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Rejected',
        data: data.map(d => d.rejected),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: {
            size: 12
          },
          padding: 15,
          usePointStyle: true,
        }
      },
      title: {
        display: false,
      },
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
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
