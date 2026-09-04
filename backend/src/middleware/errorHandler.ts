import { Request, Response, NextFunction } from 'express';

/**
 * Global safe error handler.
 * Prevents stack trace, secrets, or internal infrastructure details from leaking to clients.
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error('[GlobalErrorHandler] Unhandled error:', err instanceof Error ? err.message : err);

  res.status(500).json({
    error: 'An internal server error occurred. Please try again later.',
  });
}
