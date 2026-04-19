import { readSessionToken, verifyToken } from "./auth";
import { dashboardRoute } from "./routes/dashboard";
import {
  deleteDocumentoRoute,
  downloadDocumentoRoute,
  getDocumentoRoute,
  listDocumentosRoute
} from "./routes/documentos";
import { loginRoute, logoutRoute } from "./routes/auth";
import { uploadRoute } from "./routes/upload";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_USER: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
  ASSETS?: Fetcher;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/login.html" ||
    pathname === "/" ||
    pathname === "/index.html" ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/img/")
  );
}

async function getUserFromRequest(request: Request, env: Env): Promise<string | null> {
  const token = readSessionToken(request);
  if (!token) return null;

  const payload = await verifyToken(token, env.JWT_SECRET);
  return payload?.sub ?? null;
}

async function serveStatic(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/") {
    return Response.redirect(`${url.origin}/login`, 302);
  }

  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }

  return new Response("Static assets binding não configurado.", { status: 500 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/login") {
      if (request.method === "GET") return serveStatic(new Request(`${url.origin}/login.html`, request), env);
      return loginRoute(request, env);
    }

    if (pathname === "/logout") return logoutRoute();

    const username = await getUserFromRequest(request, env);
    const isApi = pathname.startsWith("/api/");

    if (!username && !isPublicPath(pathname)) {
      if (isApi) return Response.json({ ok: false, message: "Não autenticado" }, { status: 401 });
      return Response.redirect(`${url.origin}/login`, 302);
    }

    if (isApi && !username) {
      return Response.json({ ok: false, message: "Não autenticado" }, { status: 401 });
    }
    const authUser = username ?? "";

    if (pathname === "/api/upload") return uploadRoute(request, env, authUser);
    if (pathname === "/api/dashboard") return dashboardRoute(env, authUser);
    if (pathname === "/api/documentos" && request.method === "GET") return listDocumentosRoute(request, env, authUser);

    const docMatch = pathname.match(/^\/api\/documentos\/(\d+)$/);
    if (docMatch) {
      const id = Number(docMatch[1]);
      if (request.method === "GET") return getDocumentoRoute(env, authUser, id);
      if (request.method === "DELETE") return deleteDocumentoRoute(env, authUser, id);
    }

    const downloadMatch = pathname.match(/^\/api\/documentos\/(\d+)\/download$/);
    if (downloadMatch && request.method === "GET") {
      return downloadDocumentoRoute(request, env, authUser, Number(downloadMatch[1]));
    }

    return serveStatic(request, env);
  }
};
