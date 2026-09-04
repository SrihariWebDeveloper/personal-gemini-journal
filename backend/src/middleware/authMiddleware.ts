import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Authentication middleware that verifies the Firebase ID token in the Authorization header.
 * Strictly extracts the UID from the cryptographically verified token claims.
 */
export async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header with Bearer token.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    res.status(401).json({
      error: 'Unauthorized: Empty bearer token.',
    });
    return;
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken || !decodedToken.uid) {
      res.status(401).json({
        error: 'Unauthorized: Invalid token payload.',
      });
      return;
    }

    // Attach verified user data - UID is derived strictly from the verified token
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (err: unknown) {
    // Never expose stack trace or internal token error details to client
    const errorMessage = err instanceof Error ? err.message : 'Unknown auth error';
    console.error('[AuthMiddleware] Token verification failed:', errorMessage);
    res.status(401).json({
      error: 'Unauthorized: Invalid, expired, or revoked Firebase ID token.',
    });
  }
}
