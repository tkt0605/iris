import { pipeline, env } from "@huggingface/transformers";
env.allowLocalModels = false;

class SummarizeSingleton {
    static task ="summarization";
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
        const { userText } = event.data;
        const PROMT = `
            以下のテキストを10文字から15字以内で要約してください。
            テキスト： ${userText}
        `
        const generator = await SummarizeSingleton.getInstance((data) => {
            self.postMessage({status: "Progress", ...data});
        } );

        const messages = [
            { role: "system", content: PROMT},
            { role: "user", content: userText}
        ];
        const output = await generator(messages, {
            max_length: 15,
            min_length: 10,
            do_sample: false,
        });
        const generated_title = output[0].summary_text;

        self.postMessage({
            status: "complete",
            output: generated_title,
        });
    } catch (error) {
        console.error('タイトル生成 LLM 内部エラー:',error);
        console.error('エラーの型：', typeof error);
        console.error('エラーの本体：',error);
        console.error('エラーKeys:', error !== null && typeof error === "object" ? Object.keys(error) : []);
        self.postMessage({
            status: "error",
            error: error.message ?? String(error),
        });
    }
});