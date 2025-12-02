import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await adminApi.getJobs({ page: 1, limit: 20 });
      setJobs(response.data.items || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">일자리 관리</h1>
      <div className="bg-white shadow rounded-lg p-6">
        {isLoading ? (
          <p className="text-gray-500">로딩 중...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">등록된 일자리가 없습니다</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">급여</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3 text-sm">{job.title}</td>
                  <td className="px-4 py-3 text-sm">{job.category?.name}</td>
                  <td className="px-4 py-3 text-sm">{job.pay?.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-sm">{job.status}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(job.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
