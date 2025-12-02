import { useState, useEffect } from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { adminApi } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalMatches: number;
  completedMatches: number;
  totalRevenue: number;
  todayRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          name: '전체 사용자',
          value: stats.totalUsers.toLocaleString(),
          subValue: `활성: ${stats.activeUsers.toLocaleString()}`,
          icon: UsersIcon,
          color: 'bg-blue-500',
        },
        {
          name: '일자리',
          value: stats.totalJobs.toLocaleString(),
          subValue: `진행중: ${stats.activeJobs.toLocaleString()}`,
          icon: BriefcaseIcon,
          color: 'bg-green-500',
        },
        {
          name: '매칭',
          value: stats.totalMatches.toLocaleString(),
          subValue: `완료: ${stats.completedMatches.toLocaleString()}`,
          icon: CheckCircleIcon,
          color: 'bg-purple-500',
        },
        {
          name: '총 거래액',
          value: `${(stats.totalRevenue / 10000).toLocaleString()}만원`,
          subValue: `오늘: ${(stats.todayRevenue / 10000).toLocaleString()}만원`,
          icon: CurrencyDollarIcon,
          color: 'bg-yellow-500',
        },
      ]
    : [];

  // Sample chart data
  const lineChartData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '신규 가입',
        data: [12, 19, 15, 25, 22, 30, 18],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4,
      },
      {
        label: '매칭 완료',
        data: [8, 12, 10, 18, 15, 22, 14],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: ['이사/운반', '청소', '심부름', '행사', '기타'],
    datasets: [
      {
        label: '카테고리별 일자리',
        data: [45, 32, 28, 18, 12],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="year">올해</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
          >
            <dt>
              <div className={`absolute rounded-md ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="ml-2 text-sm text-gray-500">{stat.subValue}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">일별 현황</h3>
          <Line
            data={lineChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리별 일자리</h3>
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {[
            { type: '신규 가입', user: '김*수', time: '5분 전' },
            { type: '일자리 등록', user: '이*미', time: '12분 전' },
            { type: '매칭 완료', user: '박*준', time: '23분 전' },
            { type: '결제 완료', user: '최*영', time: '45분 전' },
            { type: '리뷰 작성', user: '정*현', time: '1시간 전' },
          ].map((activity, idx) => (
            <li key={idx} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>님이{' '}
                  <span className="text-indigo-600">{activity.type}</span>
                </p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
