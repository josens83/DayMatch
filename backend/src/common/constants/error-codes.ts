/**
 * DayMatch API Error Codes
 *
 * Error code format: DOMAIN_ACTION_ERROR
 * HTTP Status mapping included
 */

export enum ErrorCode {
  // General errors (1000-1099)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Auth errors (1100-1199)
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_EXPIRED = 'AUTH_REFRESH_TOKEN_EXPIRED',
  AUTH_PHONE_NOT_VERIFIED = 'AUTH_PHONE_NOT_VERIFIED',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_ACCOUNT_SUSPENDED = 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_INACTIVE = 'AUTH_ACCOUNT_INACTIVE',
  AUTH_OTP_INVALID = 'AUTH_OTP_INVALID',
  AUTH_OTP_EXPIRED = 'AUTH_OTP_EXPIRED',

  // User errors (1200-1299)
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_EMAIL_TAKEN = 'USER_EMAIL_TAKEN',
  USER_PHONE_TAKEN = 'USER_PHONE_TAKEN',
  USER_NICKNAME_TAKEN = 'USER_NICKNAME_TAKEN',
  USER_NOT_HELPER = 'USER_NOT_HELPER',
  USER_NOT_REQUESTER = 'USER_NOT_REQUESTER',
  USER_PROFILE_INCOMPLETE = 'USER_PROFILE_INCOMPLETE',

  // Job errors (1300-1399)
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  JOB_ALREADY_CLOSED = 'JOB_ALREADY_CLOSED',
  JOB_ALREADY_MATCHED = 'JOB_ALREADY_MATCHED',
  JOB_EXPIRED = 'JOB_EXPIRED',
  JOB_NOT_OWNER = 'JOB_NOT_OWNER',
  JOB_CANNOT_EDIT = 'JOB_CANNOT_EDIT',
  JOB_CANNOT_DELETE = 'JOB_CANNOT_DELETE',
  JOB_INVALID_DATE = 'JOB_INVALID_DATE',
  JOB_INVALID_PAY = 'JOB_INVALID_PAY',

  // Application errors (1400-1499)
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',
  APPLICATION_ALREADY_EXISTS = 'APPLICATION_ALREADY_EXISTS',
  APPLICATION_CANNOT_APPLY_OWN_JOB = 'APPLICATION_CANNOT_APPLY_OWN_JOB',
  APPLICATION_JOB_CLOSED = 'APPLICATION_JOB_CLOSED',
  APPLICATION_ALREADY_ACCEPTED = 'APPLICATION_ALREADY_ACCEPTED',
  APPLICATION_ALREADY_REJECTED = 'APPLICATION_ALREADY_REJECTED',
  APPLICATION_CANNOT_CANCEL = 'APPLICATION_CANNOT_CANCEL',
  APPLICATION_NOT_AUTHORIZED = 'APPLICATION_NOT_AUTHORIZED',

  // Match errors (1500-1599)
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  MATCH_ALREADY_EXISTS = 'MATCH_ALREADY_EXISTS',
  MATCH_ALREADY_STARTED = 'MATCH_ALREADY_STARTED',
  MATCH_ALREADY_COMPLETED = 'MATCH_ALREADY_COMPLETED',
  MATCH_NOT_STARTED = 'MATCH_NOT_STARTED',
  MATCH_CANNOT_CANCEL = 'MATCH_CANNOT_CANCEL',
  MATCH_CANCEL_TOO_LATE = 'MATCH_CANCEL_TOO_LATE',
  MATCH_NOT_AUTHORIZED = 'MATCH_NOT_AUTHORIZED',
  MATCH_HELPER_NOT_COMPLETED = 'MATCH_HELPER_NOT_COMPLETED',

  // Payment errors (1600-1699)
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_PAID = 'PAYMENT_ALREADY_PAID',
  PAYMENT_ALREADY_REFUNDED = 'PAYMENT_ALREADY_REFUNDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  PAYMENT_AMOUNT_MISMATCH = 'PAYMENT_AMOUNT_MISMATCH',
  PAYMENT_CANNOT_REFUND = 'PAYMENT_CANNOT_REFUND',
  PAYMENT_REFUND_PERIOD_EXPIRED = 'PAYMENT_REFUND_PERIOD_EXPIRED',
  PAYMENT_RELEASE_FAILED = 'PAYMENT_RELEASE_FAILED',

  // Chat errors (1700-1799)
  CHAT_ROOM_NOT_FOUND = 'CHAT_ROOM_NOT_FOUND',
  CHAT_NOT_PARTICIPANT = 'CHAT_NOT_PARTICIPANT',
  CHAT_MESSAGE_TOO_LONG = 'CHAT_MESSAGE_TOO_LONG',
  CHAT_BLOCKED_USER = 'CHAT_BLOCKED_USER',

  // Review errors (1800-1899)
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  REVIEW_NOT_AUTHORIZED = 'REVIEW_NOT_AUTHORIZED',
  REVIEW_MATCH_NOT_COMPLETED = 'REVIEW_MATCH_NOT_COMPLETED',
  REVIEW_PERIOD_EXPIRED = 'REVIEW_PERIOD_EXPIRED',

  // Notification errors (1900-1999)
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_PUSH_FAILED = 'NOTIFICATION_PUSH_FAILED',

  // Upload errors (2000-2099)
  UPLOAD_FILE_TOO_LARGE = 'UPLOAD_FILE_TOO_LARGE',
  UPLOAD_INVALID_FILE_TYPE = 'UPLOAD_INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
}

// Error messages in Korean
export const ErrorMessages: Record<ErrorCode, string> = {
  // General
  [ErrorCode.INTERNAL_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다.',
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.CONFLICT]: '이미 존재하는 리소스입니다.',
  [ErrorCode.VALIDATION_ERROR]: '입력 값이 유효하지 않습니다.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',

  // Auth
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: '인증이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCode.AUTH_TOKEN_INVALID]: '유효하지 않은 인증 토큰입니다.',
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCode.AUTH_PHONE_NOT_VERIFIED]: '휴대폰 인증이 필요합니다.',
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: '이메일 인증이 필요합니다.',
  [ErrorCode.AUTH_ACCOUNT_SUSPENDED]: '계정이 정지되었습니다.',
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: '비활성화된 계정입니다.',
  [ErrorCode.AUTH_OTP_INVALID]: '인증번호가 일치하지 않습니다.',
  [ErrorCode.AUTH_OTP_EXPIRED]: '인증번호가 만료되었습니다.',

  // User
  [ErrorCode.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ErrorCode.USER_ALREADY_EXISTS]: '이미 가입된 사용자입니다.',
  [ErrorCode.USER_EMAIL_TAKEN]: '이미 사용 중인 이메일입니다.',
  [ErrorCode.USER_PHONE_TAKEN]: '이미 사용 중인 휴대폰 번호입니다.',
  [ErrorCode.USER_NICKNAME_TAKEN]: '이미 사용 중인 닉네임입니다.',
  [ErrorCode.USER_NOT_HELPER]: '헬퍼 등록이 필요합니다.',
  [ErrorCode.USER_NOT_REQUESTER]: '의뢰인 등록이 필요합니다.',
  [ErrorCode.USER_PROFILE_INCOMPLETE]: '프로필을 완성해주세요.',

  // Job
  [ErrorCode.JOB_NOT_FOUND]: '일자리를 찾을 수 없습니다.',
  [ErrorCode.JOB_ALREADY_CLOSED]: '이미 마감된 일자리입니다.',
  [ErrorCode.JOB_ALREADY_MATCHED]: '이미 매칭된 일자리입니다.',
  [ErrorCode.JOB_EXPIRED]: '마감 기한이 지난 일자리입니다.',
  [ErrorCode.JOB_NOT_OWNER]: '일자리 작성자만 수정할 수 있습니다.',
  [ErrorCode.JOB_CANNOT_EDIT]: '이 일자리는 수정할 수 없습니다.',
  [ErrorCode.JOB_CANNOT_DELETE]: '이 일자리는 삭제할 수 없습니다.',
  [ErrorCode.JOB_INVALID_DATE]: '유효하지 않은 작업 날짜입니다.',
  [ErrorCode.JOB_INVALID_PAY]: '유효하지 않은 급여입니다.',

  // Application
  [ErrorCode.APPLICATION_NOT_FOUND]: '지원 내역을 찾을 수 없습니다.',
  [ErrorCode.APPLICATION_ALREADY_EXISTS]: '이미 지원한 일자리입니다.',
  [ErrorCode.APPLICATION_CANNOT_APPLY_OWN_JOB]: '본인이 등록한 일자리에는 지원할 수 없습니다.',
  [ErrorCode.APPLICATION_JOB_CLOSED]: '마감된 일자리에는 지원할 수 없습니다.',
  [ErrorCode.APPLICATION_ALREADY_ACCEPTED]: '이미 수락된 지원입니다.',
  [ErrorCode.APPLICATION_ALREADY_REJECTED]: '이미 거절된 지원입니다.',
  [ErrorCode.APPLICATION_CANNOT_CANCEL]: '지원을 취소할 수 없습니다.',
  [ErrorCode.APPLICATION_NOT_AUTHORIZED]: '지원 권한이 없습니다.',

  // Match
  [ErrorCode.MATCH_NOT_FOUND]: '매칭을 찾을 수 없습니다.',
  [ErrorCode.MATCH_ALREADY_EXISTS]: '이미 매칭이 존재합니다.',
  [ErrorCode.MATCH_ALREADY_STARTED]: '이미 시작된 작업입니다.',
  [ErrorCode.MATCH_ALREADY_COMPLETED]: '이미 완료된 작업입니다.',
  [ErrorCode.MATCH_NOT_STARTED]: '아직 시작되지 않은 작업입니다.',
  [ErrorCode.MATCH_CANNOT_CANCEL]: '이 매칭은 취소할 수 없습니다.',
  [ErrorCode.MATCH_CANCEL_TOO_LATE]: '작업 시작 24시간 전부터는 취소할 수 없습니다.',
  [ErrorCode.MATCH_NOT_AUTHORIZED]: '매칭 권한이 없습니다.',
  [ErrorCode.MATCH_HELPER_NOT_COMPLETED]: '헬퍼가 작업 완료를 먼저 요청해야 합니다.',

  // Payment
  [ErrorCode.PAYMENT_NOT_FOUND]: '결제 정보를 찾을 수 없습니다.',
  [ErrorCode.PAYMENT_ALREADY_PAID]: '이미 결제가 완료되었습니다.',
  [ErrorCode.PAYMENT_ALREADY_REFUNDED]: '이미 환불이 완료되었습니다.',
  [ErrorCode.PAYMENT_FAILED]: '결제에 실패했습니다.',
  [ErrorCode.PAYMENT_VERIFICATION_FAILED]: '결제 검증에 실패했습니다.',
  [ErrorCode.PAYMENT_AMOUNT_MISMATCH]: '결제 금액이 일치하지 않습니다.',
  [ErrorCode.PAYMENT_CANNOT_REFUND]: '환불이 불가능합니다.',
  [ErrorCode.PAYMENT_REFUND_PERIOD_EXPIRED]: '환불 가능 기간이 지났습니다.',
  [ErrorCode.PAYMENT_RELEASE_FAILED]: '정산 처리에 실패했습니다.',

  // Chat
  [ErrorCode.CHAT_ROOM_NOT_FOUND]: '채팅방을 찾을 수 없습니다.',
  [ErrorCode.CHAT_NOT_PARTICIPANT]: '채팅 참여자가 아닙니다.',
  [ErrorCode.CHAT_MESSAGE_TOO_LONG]: '메시지가 너무 깁니다.',
  [ErrorCode.CHAT_BLOCKED_USER]: '차단된 사용자입니다.',

  // Review
  [ErrorCode.REVIEW_NOT_FOUND]: '리뷰를 찾을 수 없습니다.',
  [ErrorCode.REVIEW_ALREADY_EXISTS]: '이미 리뷰를 작성했습니다.',
  [ErrorCode.REVIEW_NOT_AUTHORIZED]: '리뷰 작성 권한이 없습니다.',
  [ErrorCode.REVIEW_MATCH_NOT_COMPLETED]: '완료된 매칭에만 리뷰를 작성할 수 있습니다.',
  [ErrorCode.REVIEW_PERIOD_EXPIRED]: '리뷰 작성 기간이 지났습니다.',

  // Notification
  [ErrorCode.NOTIFICATION_NOT_FOUND]: '알림을 찾을 수 없습니다.',
  [ErrorCode.NOTIFICATION_PUSH_FAILED]: '푸시 알림 전송에 실패했습니다.',

  // Upload
  [ErrorCode.UPLOAD_FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
  [ErrorCode.UPLOAD_INVALID_FILE_TYPE]: '지원하지 않는 파일 형식입니다.',
  [ErrorCode.UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',
};

// HTTP status code mapping
export const ErrorHttpStatus: Partial<Record<ErrorCode, number>> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,

  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_ACCOUNT_SUSPENDED]: 403,
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: 403,

  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_EMAIL_TAKEN]: 409,
  [ErrorCode.USER_PHONE_TAKEN]: 409,
  [ErrorCode.USER_NICKNAME_TAKEN]: 409,

  [ErrorCode.JOB_NOT_FOUND]: 404,
  [ErrorCode.JOB_NOT_OWNER]: 403,

  [ErrorCode.APPLICATION_NOT_FOUND]: 404,
  [ErrorCode.APPLICATION_ALREADY_EXISTS]: 409,
  [ErrorCode.APPLICATION_NOT_AUTHORIZED]: 403,

  [ErrorCode.MATCH_NOT_FOUND]: 404,
  [ErrorCode.MATCH_NOT_AUTHORIZED]: 403,

  [ErrorCode.PAYMENT_NOT_FOUND]: 404,

  [ErrorCode.CHAT_ROOM_NOT_FOUND]: 404,
  [ErrorCode.CHAT_NOT_PARTICIPANT]: 403,

  [ErrorCode.REVIEW_NOT_FOUND]: 404,
  [ErrorCode.REVIEW_NOT_AUTHORIZED]: 403,
};
