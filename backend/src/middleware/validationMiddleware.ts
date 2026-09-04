import { Request, Response, NextFunction } from 'express';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const MAX_MESSAGES_COUNT = 60;
const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 1;

/**
 * Validates request body for chat and analysis endpoints
 */
export function validateJournalMessages(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid request body: Expected JSON object.' });
    return;
  }

  const { messages } = body;

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request: "messages" must be an array.' });
    return;
  }

  if (messages.length === 0) {
    res.status(400).json({ error: 'Invalid request: "messages" array cannot be empty.' });
    return;
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    res.status(400).json({
      error: `Invalid request: "messages" exceeds maximum allowed history (${MAX_MESSAGES_COUNT} messages).`,
    });
    return;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      res.status(400).json({ error: `Message at index ${i} is invalid.` });
      return;
    }

    const { role, content } = msg;

    if (role !== 'user' && role !== 'model') {
      res.status(400).json({
        error: `Message at index ${i} has invalid role. Expected "user" or "model".`,
      });
      return;
    }

    if (typeof content !== 'string') {
      res.status(400).json({
        error: `Message at index ${i} has invalid content. Expected string.`,
      });
      return;
    }

    const trimmed = content.trim();
    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `Message at index ${i} cannot be empty.`,
      });
      return;
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `Message at index ${i} exceeds maximum character limit of ${MAX_MESSAGE_LENGTH}.`,
      });
      return;
    }
  }

  next();
}
