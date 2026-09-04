import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import journalRoutes from './backend/src/routes/journalRoutes';
import { globalErrorHandler } from './backend/src/middleware/errorHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security: Payload size limits to protect against DoS attacks
  app.use(express.json({ limit: '250kb' }));

  // Security: Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Personal Gemini Journal API',
      timestamp: new Date().toISOString(),
    });
  });

  // Journal API routes (Protected by Firebase Auth middleware)
  app.use('/api/journal', journalRoutes);

  // Safe global error handler
  app.use(globalErrorHandler);

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
