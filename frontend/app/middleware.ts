import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middlewire(request: NextRequest){
    let response = NextResponse.next({
        request: {
            headers: request.headers
        },
    });
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies:{
                get(name: string){
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions){
                    request.cookies.set({
                        name,
                        value,
                        ...options
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers
                        }
                    })
                    response.cookies.set({
                        name, 
                        value: '',
                        ...options
                    })
                },
            },
        }
    );
    const { data: {user} } = await supabase.auth.getUser();
    if(!user &&  request.nextUrl.pathname !== '/auth/login_signup'){
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login_signup'
        return NextResponse.redirect(url);
    }
    if (user && request.nextUrl.pathname === "/auth/login_signup"){
        const url = request.nextUrl.clone();
        url.pathname = '/home'
        return NextResponse.redirect(url);
    }
    return response;
}
export const config = {
    matcher: [
        /*
         * 以下のパスを除外（監視しない）:
         * - _next/static (静的ファイル)
         * - _next/image (画像最適化ファイル)
         * - favicon.ico (ファビコン)
         * - 画像ファイル (.svg, .png, .jpg, .jpeg, .gif, .webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      ],
}