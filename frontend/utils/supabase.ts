import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// // 環境変数が読み込めていない場合にエラーを出す（デバッグ用）
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Supabaseの環境変数が設定されていません。.envを確認してください。')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey)