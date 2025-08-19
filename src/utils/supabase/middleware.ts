import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type JwtClaims = {
  sub?: string;
  email?: string;
  user_role?: string;
  user_metadata?: { user_role?: string };
  role?: string;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getClaims for faster JWT verification [Added 19.8.2025]
  const {
    data: claimsData,
    error: claimsError
  } = await supabase.auth.getClaims();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/resetpassword") ||
    pathname.startsWith("/updatepassword");

  // Skip role check on public paths
  if (isPublicPath) {
    return supabaseResponse;
  }

  // Check if we have valid claims (user is authenticated)
  if (claimsError || !claimsData?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const claims = claimsData.claims as JwtClaims;

  // Extract user role from JWT claims (faster than re-decoding)
  const userRole = claims.user_role || claims.user_metadata?.user_role || claims.role;
  
  if (!session?.access_token || !userRole) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }


  // Supabase comment:

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
