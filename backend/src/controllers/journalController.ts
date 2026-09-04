import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { generateJournalChatReply, analyzeJournalSession } from '../services/geminiService';

/**
 * Handle multi-turn chat request with Gemini
 */
export async function chatHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // Ensure user is authenticated
  if (!req.user || !req.user.uid) {
    res.status(401).json({ error: 'Unauthorized: User authentication required.' });
    return;
  }

  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const messages = Array.isArray(body.messages) ? body.messages : [];

  try {
    const reply = await generateJournalChatReply(messages);
    res.json({
      role: 'model',
      content: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat generation failed';
    res.status(500).json({
      error: 'Failed to generate response. Please try again later.',
    });
  }
}

/**
 * Handle journal session analysis and structured summary generation
 */
export async function analyzeHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // Ensure user is authenticated
  if (!req.user || !req.user.uid) {
    res.status(401).json({ error: 'Unauthorized: User authentication required.' });
    return;
  }

  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const messages = Array.isArray(body.messages) ? body.messages : [];

  try {
    const analysis = await analyzeJournalSession(messages);
    res.json({
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to analyze journal session. Please try again.',
    });
  }
}
