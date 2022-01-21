import express from 'express'
import { Store, SessionData } from 'express-session'

// Adapted from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-session/index.d.ts
declare class SqliteStore extends Store {
  constructor(options: any)
  regenerate(req: express.Request, callback: (err?: any) => any): void;
  load(sid: string, callback: (err: any, session?: SessionData) => any): void;
  createSession(req: express.Request, session: SessionData): void;
  get(sid: string, callback: (err: any, session?: SessionData | null) => void): void;
  set(sid: string, session: SessionData, callback?: (err?: any) => void): void;
  destroy(sid: string, callback?: (err?: any) => void): void;
  all?(callback: (err: any, obj?: SessionData[] | { [sid: string]: SessionData; } | null) => void): void;
  length?(callback: (err: any, length: number) => void): void;
  clear?(callback?: (err?: any) => void): void;
  touch?(sid: string, session: SessionData, callback?: () => void): void;

  startInterval(): void;
  clearExpiredSessions(): void;
  createDb(): void;
}

type Constructor<T = {}> = new (...args: any[]) => T;

declare function createSqliteStore(session: { Store: typeof Store }): Constructor<SqliteStore>
export = createSqliteStore
