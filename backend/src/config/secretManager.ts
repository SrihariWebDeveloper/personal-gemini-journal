import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let cachedGeminiApiKey: string | null = null;

/**
 * Retrieve the Gemini API key securely.
 * Attempts Google Cloud Secret Manager first if configured,
 * and falls back safely to process.env.GEMINI_API_KEY for local/container dev.
 * NEVER returns or logs the secret.
 */
export async function getGeminiApiKey(): Promise<string> {
  if (cachedGeminiApiKey) {
    return cachedGeminiApiKey;
  }

  // 1. Try Google Cloud Secret Manager if secret name or GCP project is specified
  const secretName = process.env.GEMINI_SECRET_NAME || 'GEMINI_API_KEY';
  let projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (!projectId) {
    // Try to load projectId from firebase-applet-config.json if available
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.projectId) {
          projectId = parsed.projectId;
        }
      }
    } catch {
      // Ignore reading error
    }
  }

  if (projectId) {
    try {
      const client = new SecretManagerServiceClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload && payload.trim().length > 0) {
        cachedGeminiApiKey = payload.trim();
        return cachedGeminiApiKey;
      }
    } catch {
      // Secret Manager not accessible (e.g. local environment without GCP Secret Manager role)
      // Will fall back to environment variable
    }
  }

  // 2. Safe fallback to process.env.GEMINI_API_KEY
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    cachedGeminiApiKey = envKey.trim();
    return cachedGeminiApiKey;
  }

  throw new Error('Gemini API key is not configured in Google Secret Manager or server environment.');
}
