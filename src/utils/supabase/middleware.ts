import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from 'jwt-decode'
import { isAllowed } from './role-check'

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
          supabaseResponse = NextResponse.next({request});
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  const isPublicPath =
  pathname.startsWith('/login') ||
  pathname.startsWith('/signup') ||
  pathname.startsWith('/auth')

// Skip role check on public paths
if (isPublicPath) {
  return supabaseResponse
}

//  Redirect if not logged in
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }


// Decode the user_role claim if token exists
const token = session?.access_token
let userRole: string | undefined
if (token) {
  try {
    const decoded = jwtDecode<{ user_role?: string }>(token)
    userRole = decoded.user_role
  } catch (err) {
    console.error('[Middleware] Failed to decode JWT:', err)
  }
}
if (!token || !userRole) {
  const url = request.nextUrl.clone()
  url.pathname = '/unauthorized'
  return NextResponse.redirect(url)
}
  // Debug logs
  console.log('[Middleware] Token:', token)
  console.log('[Middleware] Decoded role:', userRole)
  console.log('[Middleware] User:', user)
  console.log('[Middleware] Pathname:', pathname)

// IF ABOVE DON'T WORK, TRY THIS OG WITHOUT DEFINED TYPES
  // let userRole: string | undefined
  // if (token) {
  //   try {
  //     const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!)
  //     userRole = (decoded as any)['user_role']
  //   } catch (err) {
  //     console.error('JWT verification failed:', err)
  //   }
  // }


// Role-based redirects

// Use the role guard helper
if (!isAllowed(userRole, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

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
