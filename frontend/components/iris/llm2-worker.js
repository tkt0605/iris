import { pipeline, env } from "@huggingface/transformers";
env.allowLocalModels = false;

// DeepSeek-R1-Distill-Qwen-1.5B (ONNX量子化版)
// ※ WebGPU 必須。WASM では推論時にOOMが発生するため使用不可。
//    WebGPU が使えない場合は Gemini API（llm-worker.js）に委譲する。
class DeepSeekR1Singleton {
    static task = "text-generation";
    static model = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            const hasWebGPU = typeof navigator !== "undefined" && !!navigator.gpu;
            if (!hasWebGPU) {
                throw new Error("NO_WEBGPU");
            }
            console.log("[DeepSeek R1] WebGPU で初期化します（dtype: q4）");
            this.instance = await pipeline(
                this.task,
                this.model,
                { device: "webgpu", dtype: "q4", progress_callback }
            );
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    // catchブロックからもアクセスできるようtryの外で宣言
    const { userText, conversationHistory, token, backendUrl } = event.data;
    try {

        const generator = await DeepSeekR1Singleton.getInstance((data) => {
            self.postMessage({ status: "progress", ...data });
        });

        const historyMessages = (conversationHistory || []).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.context,
        }));

        const reply_messages = [
            {
                role: "system",
                content: `
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
            },
            ...historyMessages,
            { role: "user", content: userText },
        ];

        const title_messages = [
            {
                role: "system",
                content: "以下のテキストを10文字から15文字以内で要約し、タイトルとして一行で出力してください。",
            },
            { role: "user", content: userText },
        ];

        const [reply_output, title_output] = await Promise.all([
            generator(reply_messages, { max_new_tokens: 512, do_sample: false }),
            generator(title_messages, { max_new_tokens: 20, do_sample: false }),
        ]);

        const reply = reply_output[0].generated_text.at(-1).content;
        const title = title_output[0].generated_text.at(-1).content;

        self.postMessage({ status: "complete", type: "reply", output: reply });
        self.postMessage({ status: "complete", type: "title", output: title });

    } catch (error) {
        // WebGPU 非対応の場合はFastAPIにフォールバック
        if (error?.message === "NO_WEBGPU") {
            console.warn("[DeepSeek R1] WebGPU 非対応のためFastAPIにフォールバックします");
            try {
                const url = backendUrl ? `${backendUrl}/api/llm` : "http://localhost:8000/api/llm";
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userText, conversationHistory: conversationHistory || [] }),
                });
                if (!response.ok) throw new Error("FastAPI Error");
                const { reply, title } = await response.json();
                self.postMessage({ status: "complete", type: "reply", output: reply });
                self.postMessage({ status: "complete", type: "title", output: title });
            } catch (apiError) {
                self.postMessage({ status: "error", error: String(apiError) });
            }
            return;
        }
        console.error('DeepSeek R1 Worker Error 型:', typeof error);
        console.error('DeepSeek R1 Worker Error 本体:', error);
        self.postMessage({
            status: "error",
            error: error?.message ?? String(error) ?? "不明なエラー",
        });
    }
});