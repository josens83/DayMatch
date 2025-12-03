import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  isHelper: boolean;
  isRequester: boolean;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, _setPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [search, filter, page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers({ search, filter, page, limit: 20 });
      setUsers(response.data.items);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    const reason = prompt('정지 사유를 입력하세요:');
    if (reason) {
      await adminApi.suspendUser(userId, reason);
      loadUsers();
    }
  };

  const handleActivate = async (userId: string) => {
    await adminApi.activateUser(userId);
    loadUsers();
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      active: '활성',
      inactive: '비활성',
      suspended: '정지',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
          <option value="helpers">헬퍼</option>
          <option value="requesters">의뢰인</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                가입일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  사용자가 없습니다
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.nickname}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {user.isRequester && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          의뢰인
                        </span>
                      )}
                      {user.isHelper && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          헬퍼
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {user.status === 'suspended' ? (
                      <button
                        onClick={() => handleActivate(user.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        활성화
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspend(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        정지
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
