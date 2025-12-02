import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job, SearchJobsParams } from '../../types';
import jobService from '../../services/jobService';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  myJobs: Job[];
  filters: SearchJobsParams;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  myJobs: [],
  filters: {
    sortBy: 'recent',
  },
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  page: 1,
};

// Async thunks
export const searchJobs = createAsyncThunk(
  'jobs/search',
  async (params: SearchJobsParams, { rejectWithValue }) => {
    try {
      const result = await jobService.search({ ...params, page: 1 });
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || '일 목록을 불러오는데 실패했습니다'
      );
    }
  }
);

export const loadMoreJobs = createAsyncThunk(
  'jobs/loadMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { jobs: JobState };
      const nextPage = state.jobs.page + 1;
      const result = await jobService.search({
        ...state.jobs.filters,
        page: nextPage,
      });
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || '더 불러오는데 실패했습니다'
      );
    }
  }
);

export const getJobDetail = createAsyncThunk(
  'jobs/getDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const job = await jobService.getById(id);
      return job;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || '일 상세를 불러오는데 실패했습니다'
      );
    }
  }
);

export const getMyJobs = createAsyncThunk(
  'jobs/getMyJobs',
  async (_, { rejectWithValue }) => {
    try {
      const jobs = await jobService.getMyJobs();
      return jobs;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || '내 일 목록을 불러오는데 실패했습니다'
      );
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<SearchJobsParams>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { sortBy: 'recent' };
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Search jobs
    builder.addCase(searchJobs.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(searchJobs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.jobs = action.payload.items;
      state.page = 1;
      state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
    });
    builder.addCase(searchJobs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Load more jobs
    builder.addCase(loadMoreJobs.pending, (state) => {
      state.isLoadingMore = true;
    });
    builder.addCase(loadMoreJobs.fulfilled, (state, action) => {
      state.isLoadingMore = false;
      state.jobs = [...state.jobs, ...action.payload.items];
      state.page = action.payload.meta.page;
      state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
    });
    builder.addCase(loadMoreJobs.rejected, (state, action) => {
      state.isLoadingMore = false;
      state.error = action.payload as string;
    });

    // Get job detail
    builder.addCase(getJobDetail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getJobDetail.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentJob = action.payload;
    });
    builder.addCase(getJobDetail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get my jobs
    builder.addCase(getMyJobs.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyJobs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.myJobs = action.payload;
    });
    builder.addCase(getMyJobs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setFilters, clearFilters, clearCurrentJob, clearError } =
  jobSlice.actions;
export default jobSlice.reducer;
