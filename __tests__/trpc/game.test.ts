import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { gameRouter } from '@/server/trpc/routers/game';

// Mock для базы данных
jest.mock('@/db/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    query: {
      gameSessions: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      gamePlayers: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      sequences: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    },
  },
}));

// Mock для Drizzle ORM
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

describe('tRPC Game Router', () => {
  describe('createSession', () => {
    it('should create a new game session', async () => {
      const caller = gameRouter.createCaller({});
      
      const result = await caller.createSession({
        name: 'Test Game',
        nValue: 3,
        totalSteps: 30,
        baseSpeedMs: 2000,
      });

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('name');
      expect(result.name).toBe('Test Game');
      expect(result.nValue).toBe(3);
    });

    it('should validate input parameters', async () => {
      const caller = gameRouter.createCaller({});

      await expect(
        caller.createSession({
          name: '', // Invalid: too short
          nValue: 3,
          totalSteps: 30,
          baseSpeedMs: 2000,
        })
      ).rejects.toThrow();
    });
  });

  describe('joinSession', () => {
    it('should join an existing session', async () => {
      const caller = gameRouter.createCaller({});

      const result = await caller.joinSession({
        sessionId: 'test-session-id',
      });

      expect(result).toHaveProperty('playerId');
      expect(result).toHaveProperty('alreadyJoined');
    });
  });

  describe('addBot', () => {
    it('should add a bot to the session', async () => {
      const caller = gameRouter.createCaller({});

      const result = await caller.addBot({
        sessionId: 'test-session-id',
        botAccuracy: 80,
      });

      expect(result).toHaveProperty('botId');
    });

    it('should validate bot accuracy range', async () => {
      const caller = gameRouter.createCaller({});

      await expect(
        caller.addBot({
          sessionId: 'test-session-id',
          botAccuracy: 150, // Invalid: > 100
        })
      ).rejects.toThrow();
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const caller = gameRouter.createCaller({});

      const result = await caller.getSessionStats({
        sessionId: 'test-session-id',
      });

      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('players');
      expect(Array.isArray(result.players)).toBe(true);
    });
  });
});