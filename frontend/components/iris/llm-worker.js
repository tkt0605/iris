import { pipeline, env } from "@huggingface/transformers";
env.allowLocalModels = false;

class IRISLLMSingleton {
    static task = 'text-generation';
    static model = 'onnx-community/Qwen2.5-0.5B-Instruct';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            // const device = (await navigator.gpu?.requestAdapter()) ? "webgpu" : "wasm";
            this.instance = await pipeline(this.task, this.model, {
                // device: "webgpu",
                device: "wasm",
                progress_callback,
            });
        }
        return this.instance;
    }
}
self.addEventListener('message', async (event) => {
    try {
        const { userText } = event.data;


        const generator = await IRISLLMSingleton.getInstance((data) => {
            self.postMessage({ status: "progress", ...data });
        });
        const reply_messages = [
            { 
                role: "system", 
                content:  `
                    あなたはIRISというAIアシスタントです。
                    ユーザーの音声から文字起こしされたテキストに対して、親切で簡潔な日本語で返答してください。
                    もし、ユーザーが質問をしたとき、その質問に対してGoogle検索を行い、その結果を参考にして返答してください。
                    以下は、ユーザーの音声から文字起こしされたテキストです。
                    ${userText}
                `
             },
            { role: "user", content: userText },
        ];
        const title_messages = [
            {
                role: "system",
                content: `以下のテキストを10文字から15文字以内で要約してください。
                テキスト：${userText}`
            },
            { role: "user", content: userText }
        ];

        const reply_output = await generator(reply_messages, {
            max_new_tokens: 512,
            do_sample: false,
        });
        const title_output = await generator(title_messages,{
            max_new_tokens: 15,
            db_sample: false
        });

        const reply = reply_output[0].generated_text.at(-1).content;
        const title = title_output[0].generated_text.at(-1).content;

        self.postMessage({
            status: "complete",
            type: "reply",
            output: reply,
        });
        self.postMessage({
            status: "complete",
            type: "title",
            output: title
        });
    } catch (error) {
        console.error('エラーの型：', typeof error);
        console.error('エラーの本体：',error);
        console.error('エラーKeys:', error !== null && typeof error === "object" ? Object.keys(error) : []);
        self.postMessage({
            status: "error",
            error: error.messages ?? String(error)
        })
    }
});