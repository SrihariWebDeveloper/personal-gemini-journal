import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!adminAuth) {
    if (getApps().length === 0) {
      let projectId = process.env.FIREBASE_PROJECT_ID;

      if (!projectId) {
        try {
          const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
          if (fs.existsSync(configPath)) {
            const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            projectId = parsed.projectId;
          }
        } catch {
          // Ignored
        }
      }

      adminApp = initializeApp({
        projectId: projectId || undefined,
      });
    } else {
      adminApp = getApp();
    }
    adminAuth = getAuth(adminApp);
  }
  return adminAuth;
}
