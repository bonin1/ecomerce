import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.ADMIN_JWT_SECRET)
        );
        return payload;
    } catch (error) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin/dashboard') || 
        request.nextUrl.pathname.startsWith('/admin/settings') || 
        request.nextUrl.pathname.startsWith('/admin/products') ||
        request.nextUrl.pathname.startsWith('/admin/careers')) {
        
        const adminToken = request.cookies.get('adminToken')?.value;
        
        const syncToken = request.cookies.get('adminTokenSync')?.value;
        
        if (!adminToken && !syncToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const token = adminToken || syncToken;
        
        if (typeof token !== 'string') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    
        const payload = await verifyToken(token);
        
        if (!payload || !payload.isAdminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        
        if (!adminToken && syncToken) {
            const response = NextResponse.next();
            response.cookies.set({
                name: 'adminToken',
                value: syncToken,
                httpOnly: true,
                path: '/',
                sameSite: 'strict',
                maxAge: 4 * 60 * 60 
            });
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/dashboard/:path*',
        '/admin/settings/:path*',
        '/admin/products/:path*',
        '/admin/careers/:path*'
    ]
};
