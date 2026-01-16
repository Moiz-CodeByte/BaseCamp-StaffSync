"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function LeaveStatusChart({ approved, pending, rejected, title = "Leave Status Distribution" }) {
  const [textColor, setTextColor] = useState('rgba(0, 0, 0, 0.8)');
  const chartRef = useRef(null);
  
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTextColor(isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)');
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

  useEffect(() => {
    // Force chart to update when textColor changes
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [textColor]);

  const total = approved + pending + rejected;

  const data = useMemo(() => ({
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [approved, pending, rejected],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }), [approved, pending, rejected]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12
          },
          padding: 15,
          color: textColor,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                  fontColor: textColor
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }), [textColor, total]);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leave requests found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Pie ref={chartRef} data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
