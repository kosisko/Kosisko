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
    response.cookies.delete({ name: 'kosisko_active_tenant', ...cookieOpts });
    response.cookies.delete('kosisko_active_tenant');
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


  // 4.5. सख्त द्वि-दिशात्मक (Bidirectional) Subdomain लॉक + Android TWA ऐप सुरक्षा
  const hostClean = host.split(':')[0].toLowerCase();
  const xRequestedWith = (request.headers.get('x-requested-with') || '').toLowerCase();
  const isTwaRequest =
    xRequestedWith.includes('kosisko') ||
    searchParams.get('twa') === '1' ||
    searchParams.get('mode') === 'twa' ||
    request.cookies.get('kosisko_is_twa')?.value === 'true';

  const rawTenantCookie = request.cookies.get('kosisko_active_tenant')?.value?.trim().toLowerCase() || '';
  const activeTenantCookie = rawTenantCookie.replace(/^https?:\/\//, '').split('.kosisko.com')[0].split('/')[0].trim();
  const reservedSubs = ['www', 'api', 'admin', 'mail', 'app', 'localhost', 'kosisko', 'kosisko.com', 'workspace'];

  if (isAuthenticated && pathname.startsWith('/customer') && hostClean.endsWith('kosisko.com')) {
    if (isTwaRequest) {
      // Android TWA ऐप में कभी Subdomain पर न भेजें ताकि Chrome URL Bar कभी न आए
      if (hostClean !== 'kosisko.com') {
        const appRootUrl = new URL(request.url);
        appRootUrl.hostname = 'kosisko.com';
        appRootUrl.protocol = 'https:';
        appRootUrl.port = '';
        const resTwa = NextResponse.redirect(appRootUrl, 307);
        resTwa.cookies.set('kosisko_is_twa', 'true', { domain: '.kosisko.com', path: '/', sameSite: 'lax', secure: true });
        return resTwa;
      }
    } else if (activeTenantCookie && activeTenantCookie !== '__none__' && !activeTenantCookie.includes('.') && !reservedSubs.includes(activeTenantCookie)) {
      // केस A: यूज़र का Subdomain रजिस्टर्ड है -> केवल उसी के Subdomain पर लॉक रखें
      const expectedHost = `${activeTenantCookie}.kosisko.com`;
      if (hostClean !== expectedHost) {
        const lockedUrl = new URL(request.url);
        lockedUrl.hostname = expectedHost;
        lockedUrl.protocol = 'https:';
        lockedUrl.port = '';
        return NextResponse.redirect(lockedUrl, 307);
      }
    } else if (!activeTenantCookie || activeTenantCookie === '__none__' || reservedSubs.includes(activeTenantCookie)) {
      // केस B: यूज़र का Subdomain रजिस्टर्ड नहीं है -> केवल रूट kosisko.com पर लॉक रखें (कोई Subdomain ऐड न हो सके)
      if (hostClean !== 'kosisko.com') {
        const rootUrl = new URL(request.url);
        rootUrl.hostname = 'kosisko.com';
        rootUrl.protocol = 'https:';
        rootUrl.port = '';
        return NextResponse.redirect(rootUrl, 307);
      }
    }
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
