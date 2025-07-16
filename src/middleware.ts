// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // No usar cookies, verificar si hay token en localStorage es del lado del cliente
  // Por ahora solo redirigimos basándonos en la ruta
  
  const isAuthPage = request.nextUrl.pathname === '/';
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // Por ahora permitir acceso a todas las rutas
  // La verificación real se hace en el cliente con useAuth
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};