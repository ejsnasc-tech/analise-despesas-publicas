import { authenticateUser, buildSessionCookie, clearSessionCookie, generateToken } from "../auth";

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export async function loginRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let username = "";
  let password = "";

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { username?: string; password?: string };
    username = body.username?.trim() ?? "";
    password = body.password ?? "";
  } else {
    const body = await request.formData();
    username = String(body.get("username") ?? "").trim();
    password = String(body.get("password") ?? "");
  }

  const user = await authenticateUser(env.DB, username, password);
  if (!user) {
    return Response.json({ ok: false, message: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await generateToken(user.username, env.JWT_SECRET);
  const response = Response.json({ ok: true, user });
  response.headers.set("Set-Cookie", buildSessionCookie(token));
  return response;
}

export function logoutRoute(): Response {
  const response = Response.redirect("/login", 302);
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
