import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export default async function middleware(request: NextRequest) {
    // 1. レスポンスの初期化
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Supabaseクライアントの作成
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 3. ユーザー情報の取得
    const { data: { user } } = await supabase.auth.getUser()

    // 4. パスによる条件分岐
    const path = request.nextUrl.pathname

    // A. 認証関連のパス (/auth/...)
    if (path.startsWith('/auth')) {
        // ログイン済みユーザーがログイン画面に来たら /home へ
        if (user && path === '/auth/login_signup') {
            const url = request.nextUrl.clone()
            url.pathname = '/home'
            return NextResponse.redirect(url)
        }
        // それ以外（コールバック等）はそのまま通す
        return response
    }

    // B. 未ログインユーザー
    // 認証パス以外へのアクセスはすべてログイン画面へリダイレクト
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login_signup'
        return NextResponse.redirect(url)
    }

    // C. ログイン済みユーザー 
    // ルートパス (/) へのアクセスは /home へリダイレクト
    if (path === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
    }

    // それ以外のページはそのまま表示
    return response
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