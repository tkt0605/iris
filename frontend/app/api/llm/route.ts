import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        // リクエストボディから、userTextとconversationHistoryを取得
        const { userText, conversationHistory } = await req.json();
        // usertextが必要です
        if (!userText) {
            return NextResponse.json({ error: "userTextが必要です" }, { status: 400 });
        }

        // conversationHistoryから、
        const historyContents = (conversationHistory || []).map((m: { role: string; context: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.context }],
        }));
        // ユーザーに対する「reply」・「Title」を並立実行させている。（Promise.all）
        // 使用する際に用いたモデルは、gemini-2.5-flashです。
        const [replyResult, titleResult] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    ...historyContents,
                    { role: "user", parts: [{ text: userText }] },
                ],
                config: {
                    systemInstruction: `
                        あなたは「IRIS」という名前のAIアシスタントです。
                        このアプリケーションは${process.env.PRODUCER}によって開発された音声対話システムです。

                        #### 入力について
                        ユーザーの発言は音声認識（Whisper）によって文字起こしされています。
                        誤変換や言い間違いが含まれる可能性があるため、文脈から意図を適切に補完してください。

                        #### 返答のルール
                            - 常に日本語で返答してください
                            - 会話の流れと過去のやり取りを踏まえて返答してください
                            - マークダウン記法（**太字**、- リストなど）は使わず、自然な文章で返答してください
                            - 返答は簡潔にまとめ、長くなる場合は要点を優先してください
                            - フレンドリーかつ丁寧なトーンを維持してください

                        #### できないこと
                            - リアルタイムの情報（天気・ニュースなど）の取得
                            - 外部サービスへのアクセス
                    `,
                    maxOutputTokens: 512,
                },
            }),
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `以下のテキストを10文字から15文字以内で要約してください。\nテキスト：${userText}`,
                config: { maxOutputTokens: 30 },
            }),
        ]);

        // // ユーザーに対する「reply」・「title」を個別生成させている。
        // const replyResult = await ai.models.generateContent({
        //     model: "gemini-2.5-flash",
        //     contents: [
        //         ...historyContents,
        //         { role: "user", parts: [{
        //             text: userText
        //         }]},
        //     ],
        //     config: {
        //         systemInstruction: "あなたはIRISというAIアシスタントです。ユーザーの音声から文字起こしされたテキストに対して、親切で簡素な日本語にして返答してください。",
        //         maxOutputTokens: 512,
        //     }
        // });
        // const titleResult = await ai.models.generateContent({
        //     model: "gemini-2.5-flash",
        //     contents: [
        //         `以下のテキストを10文字から15字以内で要約し、タイトルとして適切な文章にしてください。\nテキスト：${userText}`
        //     ],
        //     config: { maxOutputTokens: 30 }
        // });
        return NextResponse.json({
            reply: replyResult.text,
            title: titleResult.text,
        });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}