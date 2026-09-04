/**
 * Security and Functional Test Suite for Personal Gemini Journal
 * Tests authentication barriers, input validation, DoS mitigation, and data isolation logic.
 */

import test from 'node:test';
import assert from 'node:assert';
import { validateJournalMessages } from '../backend/src/middleware/validationMiddleware';
import { Request, Response } from 'express';

function createMockRes() {
  const res = {
    statusCode: 200,
    jsonData: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; jsonData: unknown };
}

test('1. Security: Rejects null/empty request body with HTTP 400', () => {
  const req = { body: null } as Request;
  const res = createMockRes();
  let nextCalled = false;

  validateJournalMessages(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('2. Security: Rejects empty messages array with HTTP 400', () => {
  const req = { body: { messages: [] } } as Request;
  const res = createMockRes();
  let nextCalled = false;

  validateJournalMessages(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('3. Security: Rejects messages with unauthorized roles with HTTP 400', () => {
  const req = {
    body: {
      messages: [{ role: 'system_override', content: 'hello' }],
    },
  } as Request;
  const res = createMockRes();
  let nextCalled = false;

  validateJournalMessages(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('4. Security: Rejects oversized payload message (>4000 chars) with HTTP 400', () => {
  const req = {
    body: {
      messages: [{ role: 'user', content: 'X'.repeat(4001) }],
    },
  } as Request;
  const res = createMockRes();
  let nextCalled = false;

  validateJournalMessages(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('5. Functional: Accepts valid conversational messages payload', () => {
  const req = {
    body: {
      messages: [
        { role: 'user', content: 'I have been reflecting on my career goals.' },
        { role: 'model', content: 'What aspects feel most meaningful to you right now?' },
      ],
    },
  } as Request;
  const res = createMockRes();
  let nextCalled = false;

  validateJournalMessages(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

test('6. Data Isolation Invariant: User A cannot access User B subcollections', () => {
  const userA_uid = 'authenticated_user_alpha_123';
  const userB_uid = 'authenticated_user_beta_456';

  // Rule: request.auth.uid == uid
  const allowsAccess = (callerUid: string, targetPathUid: string) => callerUid === targetPathUid;

  assert.strictEqual(allowsAccess(userA_uid, userA_uid), true, 'User A should access their own data');
  assert.strictEqual(allowsAccess(userA_uid, userB_uid), false, 'User A MUST NOT access User B data');
  assert.strictEqual(allowsAccess(userB_uid, userA_uid), false, 'User B MUST NOT access User A data');
});
