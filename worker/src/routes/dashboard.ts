import { getDashboardStats } from "../db";

interface Env {
  DB: D1Database;
}

export async function dashboardRoute(env: Env, username: string): Promise<Response> {
  const stats = await getDashboardStats(env.DB, username);
  return Response.json(stats);
}
