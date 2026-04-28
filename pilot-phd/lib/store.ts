export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: number;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  createdAt: number;
}

export type AppStatus =
  | "planning"
  | "applied"
  | "waiting"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  userId: string;
  university: string;
  program: string;
  deadline: string;
  interest: string;
  status: AppStatus;
  createdAt: number;
  updatedAt: number;
}

// In-memory stores — reset on server restart (fine for a demo)
export const users = new Map<string, User>();
export const sessions = new Map<string, Session>();
export const applications = new Map<string, Application>();
