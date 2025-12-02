import api from './api';
import {
  Job,
  CreateJobRequest,
  SearchJobsParams,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const jobService = {
  async search(params: SearchJobsParams): Promise<PaginatedResponse<Job>> {
    const response = await api.get<ApiResponse<Job[]>>('/jobs', { params });
    return {
      items: response.data.data,
      meta: response.data.meta!,
    };
  },

  async getById(id: string): Promise<Job> {
    const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data.data;
  },

  async create(data: CreateJobRequest): Promise<Job> {
    const response = await api.post<ApiResponse<Job>>('/jobs', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<CreateJobRequest>): Promise<Job> {
    const response = await api.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async getMyJobs(): Promise<Job[]> {
    const response = await api.get<ApiResponse<Job[]>>('/jobs/my');
    return response.data.data;
  },
};

export default jobService;
