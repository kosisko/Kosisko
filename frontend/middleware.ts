import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 0. PWA & Play Store (TWA) पब्लिक एसेट्स बाईपास (बिना लॉगिन सीधे 200 OK मिलना चाहिए)
  if (
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next();
  }

  // 1. क्या यूजर लॉगआउट रिक्वेस्ट लेकर आ रहा है?
  const isLogoutRequest = searchParams.get('logout') === 'true';

  if (isLogoutRequest && pathname === '/login') {
    const response = NextResponse.next();
    const cookieOpts = { domain: '.kosisko.com', path: '/' };
    response.cookies.delete({ name: 'access_token', ...cookieOpts });
    response.cookies.delete({ name: 'refresh_token', ...cookieOpts });
    response.cookies.delete({ name: 'kosisko_logged_in', ...cookieOpts });
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('kosisko_logged_in');
    return response;
  }

  // 2. कुकी से टोकन या स्थिति पढ़ें
  const accessToken = request.cookies.get('access_token')?.value;
  const isLoggedIn = request.cookies.get('kosisko_logged_in')?.value === 'true';
  const isAuthenticated = Boolean(accessToken || isLoggedIn);

  const isOnboardingFlow = searchParams.get('onboarding') === 'true';

  // 3. पब्लिक रूट्स
  const isPublicAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-otp') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/refund-policy') ||
    pathname.startsWith('/shipping-policy') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact') ||
    pathname === '/';

  // 4. अनऑथेंटिकेटेड यूजर को प्रोटेक्टेड रूट्स से रोकना
  if (!isAuthenticated && !isPublicAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }


  // 🌟 6. मास्टर ऐप / PWA पाथ-बेस्ड रूटिंग: /workspace/[tenant]/...
  if (pathname.startsWith('/workspace/')) {
    const segments = pathname.split('/').filter(Boolean); // ['workspace', 'ratan', 'dashboard']
    const tenantSlug = segments[1]; // 'ratan'
    const subPath = '/' + segments.slice(2).join('/');
    const targetPath = subPath === '/' || subPath === '' ? '/' : subPath;

    const rewriteUrl = new URL(targetPath, request.url);
    searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-subdomain', tenantSlug);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('x-tenant-subdomain', tenantSlug);
    // टेनेंट कुकी भी सिंक रखें
    response.cookies.set('kosisko_active_tenant', tenantSlug, {
      domain: '.kosisko.com',
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
    return response;
  }

  // 7. मल्टी-टेनेंट सबडोमेन रूटिंग (ब्राउज़र के लिए: ratan.kosisko.com)
  const hostParts = host.split(':')[0].split('.');

  if (hostParts.length >= 3 && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const currentSubdomain = hostParts[0].toLowerCase();
    const reserved = ['www', 'api', 'admin', 'mail', 'app'];

    if (!reserved.includes(currentSubdomain)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant-subdomain', currentSubdomain);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.headers.set('x-tenant-subdomain', currentSubdomain);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
