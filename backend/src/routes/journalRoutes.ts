import { Router } from 'express';
import { authenticateFirebaseUser } from '../middleware/authMiddleware';
import { validateJournalMessages } from '../middleware/validationMiddleware';
import { chatHandler, analyzeHandler } from '../controllers/journalController';

const router = Router();

// Multi-turn conversational journal endpoint
router.post('/chat', authenticateFirebaseUser, validateJournalMessages, chatHandler);

// Journal session end/save structured analysis endpoint
router.post('/analyze', authenticateFirebaseUser, validateJournalMessages, analyzeHandler);

export default router;
