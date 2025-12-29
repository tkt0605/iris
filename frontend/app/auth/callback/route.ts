import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  // URLから情報を取り出す
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // ログイン後に飛ばしたい場所（指定がなければ /home）
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    // Cookieストアを取得（Next.js 15/16以降はawaitが必要です）
    const cookieStore = await cookies()

    // Supabaseクライアントを作成（サーバー側での操作用）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // ★重要: 引換券(code)をセッションに交換する
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 成功したら、ホーム画面（または元の場所）へリダイレクト
      // ログイン成功！
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 何らかのエラー（コードが無効など）ならログイン画面へ戻す
  return NextResponse.redirect(`${origin}/auth/login_signup?error=auth`)
}