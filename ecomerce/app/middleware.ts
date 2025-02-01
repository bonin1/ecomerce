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
    if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
        const adminToken = request.cookies.get('adminToken')?.value;
        
        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const payload = await verifyToken(adminToken);
        if (!payload || !payload.isAdminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/dashboard/:path*',
        '/admin/settings/:path*'
    ]
};
