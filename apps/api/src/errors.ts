import type { ApiErrorEnvelope } from '@lms/contracts';

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function serializeError(
  error: unknown,
  requestId: string,
): {
  statusCode: number;
  body: ApiErrorEnvelope;
} {
  const knownError = error instanceof AppError;
  const bodyParseError =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed';
  const bodyTooLargeError =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large';
  const statusCode = knownError
    ? error.statusCode
    : bodyParseError
      ? 400
      : bodyTooLargeError
        ? 413
        : 500;
  const code = knownError
    ? error.code
    : bodyParseError
      ? 'INVALID_REQUEST_BODY'
      : bodyTooLargeError
        ? 'PAYLOAD_TOO_LARGE'
        : 'INTERNAL_SERVER_ERROR';
  const message = knownError
    ? error.message
    : bodyParseError
      ? 'Request body is not valid JSON.'
      : bodyTooLargeError
        ? 'Request body exceeds the 1 MiB limit.'
        : 'An unexpected error occurred.';

  return {
    statusCode,
    body: {
      success: false,
      error: { code, message, requestId },
    },
  };
}
