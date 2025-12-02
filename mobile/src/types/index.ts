// User types
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  nickname?: string;
  profileImage?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  isRequester: boolean;
  isHelper: boolean;
  isVerified: boolean;
  bio?: string;
  skills?: string[];
  availableAreas?: string[];
  ratingAsRequester: number;
  ratingAsHelper: number;
  reviewCount: number;
  createdAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  name: string;
  nickname?: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  displayOrder: number;
}

// Job types
export type PayType = 'hourly' | 'daily' | 'fixed';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type GenderPrefer = 'any' | 'male' | 'female';

export interface Job {
  id: string;
  requesterId: string;
  requester: User;
  title: string;
  description: string;
  categoryId?: number;
  category?: Category;
  subCategoryId?: number;
  subCategory?: SubCategory;
  workDate: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  address: string;
  addressDetail?: string;
  latitude?: number;
  longitude?: number;
  sido?: string;
  sigungu?: string;
  payType: PayType;
  payAmount: number;
  isNegotiable: boolean;
  helperCount: number;
  appliedCount: number;
  matchedCount: number;
  requirements?: string;
  preferred?: string;
  genderPrefer: GenderPrefer;
  images?: string[];
  status: JobStatus;
  createdAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  categoryId?: number;
  subCategoryId?: number;
  workDate: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  address: string;
  addressDetail?: string;
  latitude?: number;
  longitude?: number;
  sido?: string;
  sigungu?: string;
  payType: PayType;
  payAmount: number;
  isNegotiable?: boolean;
  helperCount?: number;
  requirements?: string;
  preferred?: string;
  genderPrefer?: GenderPrefer;
  images?: string[];
}

export interface SearchJobsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryId?: number;
  subCategoryId?: number;
  sido?: string;
  sigungu?: string;
  dateFrom?: string;
  dateTo?: string;
  payMin?: number;
  payMax?: number;
  payType?: PayType;
  sortBy?: 'recent' | 'pay_high' | 'pay_low' | 'deadline';
}

// Application types
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Application {
  id: string;
  jobId: string;
  job: Job;
  helperId: string;
  helper: User;
  message?: string;
  proposedPay?: number;
  status: ApplicationStatus;
  appliedAt: string;
  respondedAt?: string;
}

// Match types
export type MatchStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface Match {
  id: string;
  jobId: string;
  job: Job;
  helperId: string;
  helper: User;
  requesterId: string;
  requester: User;
  finalPay: number;
  status: MatchStatus;
  helperStartedAt?: string;
  helperCompletedAt?: string;
  requesterConfirmedAt?: string;
  createdAt: string;
  completedAt?: string;
}

// Chat types
export interface ChatRoom {
  id: string;
  jobId?: string;
  job?: Job;
  matchId?: string;
  requesterId: string;
  requester: User;
  helperId: string;
  helper: User;
  lastMessage?: string;
  lastMessageAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: User;
  content: string;
  messageType: 'text' | 'image' | 'system';
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// Review types
export interface Review {
  id: string;
  matchId: string;
  reviewerId: string;
  reviewer: User;
  revieweeId: string;
  reviewee: User;
  reviewType: 'to_helper' | 'to_requester';
  rating: number;
  content?: string;
  punctuality?: number;
  communication?: number;
  quality?: number;
  images?: string[];
  createdAt: string;
}

// Notification types
export type NotificationType =
  | 'job_applied'
  | 'application_accepted'
  | 'application_rejected'
  | 'match_created'
  | 'work_started'
  | 'work_completed'
  | 'payment_received'
  | 'review_received'
  | 'chat_message'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
