import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ErrorMessages,
  ErrorHttpStatus,
} from '../constants/error-codes';

/**
 * Custom application exception with standardized error codes
 */
export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(
    errorCode: ErrorCode,
    message?: string,
    details?: any,
    statusCode?: number,
  ) {
    const finalMessage = message || ErrorMessages[errorCode] || 'An error occurred';
    const finalStatus = statusCode || ErrorHttpStatus[errorCode] || HttpStatus.BAD_REQUEST;

    super(
      {
        code: errorCode,
        message: finalMessage,
        details,
      },
      finalStatus,
    );

    this.errorCode = errorCode;
    this.details = details;
  }

  /**
   * Create a BadRequest exception
   */
  static badRequest(message?: string, details?: any): AppException {
    return new AppException(ErrorCode.BAD_REQUEST, message, details, HttpStatus.BAD_REQUEST);
  }

  /**
   * Create an Unauthorized exception
   */
  static unauthorized(errorCode: ErrorCode = ErrorCode.UNAUTHORIZED, message?: string): AppException {
    return new AppException(errorCode, message, undefined, HttpStatus.UNAUTHORIZED);
  }

  /**
   * Create a Forbidden exception
   */
  static forbidden(errorCode: ErrorCode = ErrorCode.FORBIDDEN, message?: string): AppException {
    return new AppException(errorCode, message, undefined, HttpStatus.FORBIDDEN);
  }

  /**
   * Create a NotFound exception
   */
  static notFound(errorCode: ErrorCode = ErrorCode.NOT_FOUND, message?: string): AppException {
    return new AppException(errorCode, message, undefined, HttpStatus.NOT_FOUND);
  }

  /**
   * Create a Conflict exception
   */
  static conflict(errorCode: ErrorCode = ErrorCode.CONFLICT, message?: string): AppException {
    return new AppException(errorCode, message, undefined, HttpStatus.CONFLICT);
  }

  /**
   * Create an InternalError exception
   */
  static internal(message?: string, details?: any): AppException {
    return new AppException(
      ErrorCode.INTERNAL_ERROR,
      message,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Specific exception classes for common use cases
 */
export class AuthException extends AppException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message, undefined, HttpStatus.UNAUTHORIZED);
  }
}

export class UserNotFoundException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.USER_NOT_FOUND, message, undefined, HttpStatus.NOT_FOUND);
  }
}

export class JobNotFoundException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.JOB_NOT_FOUND, message, undefined, HttpStatus.NOT_FOUND);
  }
}

export class ApplicationNotFoundException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.APPLICATION_NOT_FOUND, message, undefined, HttpStatus.NOT_FOUND);
  }
}

export class MatchNotFoundException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.MATCH_NOT_FOUND, message, undefined, HttpStatus.NOT_FOUND);
  }
}

export class PaymentException extends AppException {
  constructor(errorCode: ErrorCode, message?: string, details?: any) {
    super(errorCode, message, details);
  }
}
