import { pipeline, env } from "@huggingface/transformers";
env.allowLocalModels = false;

class ActionWorkerSingleton {
    static task ="text-generation";
    static model = "onnx-community/Qwen2.5-0.5B-Instruct";
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(
                this.task,
                this.model,
                {
                    device: "webgpu",
                    progress_callback
                }
            );
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    try {
        const { userText } =event.data;
        const SYSTEM_PROMPT = `
            あなたはIRISというAIアシスタントです。
            ユーザーが音声で伝えた内容において、親切で簡潔な日本語で返答してください。
            回答は2〜4文程度にまとめてください。
            以下は、ユーザーの音声から文字起こしされたテキストです。
            ${userText}
        `;
        const generator = await ActionWorkerSingleton.getInstance((data) => {
            self.postMessage({status: "Progress", ...data});
        } );
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText },
        ];

        const output = await generator(messages, {
            max_new_tokens: 512,
            do_sample: false,
        });
        const reply = output[0].generated_text.at(-1).content;

        self.postMessage({
            status: "complete",
            output: reply,
        });
    } catch (error) {
        self.postMessage({
            status: "error",
            error: error.message,
        });
    }
});