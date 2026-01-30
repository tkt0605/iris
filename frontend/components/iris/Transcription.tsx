import { pipeline } from "@huggingface/transformers";

//　パイプラインの準備
const transcriber = await pipeline(
    "automatic-speech-recognition",
    "onnx-community/whisper-tiny-ja",
    {
        device: "webgpu"
    }
);

export async function transcribe() {
    try {
        const url = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav";
        const output = await transcriber(url);
        console.log(output);
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return null;
    }
};