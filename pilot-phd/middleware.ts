import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./lib/auth";

const PROTECTED = [
  "/dashboard",
  "/applications",
  "/email",
  "/statement",
  "/fellowships",
  "/briefing",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/email/:path*",
    "/statement/:path*",
    "/fellowships/:path*",
    "/briefing/:path*",
  ],
};
