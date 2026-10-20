import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const publicRoutes = ["/login", "/register", "/api/auth"];
    if (publicRoutes.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    const session = await auth();
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = session?.user?.role;
    if (pathname.startsWith("/user") && role !== "user") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/deliveryBoy") && role !== "deliveryBoy") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  } catch (error) {
    console.log(error);
  }
}

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
};
