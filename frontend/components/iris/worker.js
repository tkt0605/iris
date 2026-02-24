import {pipeline, env} from "@huggingface/transformers";
env.allowLocalModels = false;

class WhisperSignleton{
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny';
    static instance = null;

    static async GetInstance(progress_callback = null){
        console.log('GetInstance called');
        if (this.instance === null){
            this.instance = await pipeline(
                this.task,
                this.model,
                { 
                    device: "webgpu",
                    progress_callback: progress_callback
                }
            );
        }
        return this.instance;
    }
}


self.addEventListener('message', async(event) => {
    try {
        const {audio} = event.data;
        const transcriber = await WhisperSignleton.GetInstance((data) =>{
            self.postMessage({
                status: "progress",
                ...data,
            });
        });
        const output = await transcriber(audio , {
            chunk_length_s: 30,
            stride_length_s: 15,
            language: "ja",
            task: "transcribe",
        });
        self.postMessage({
            status: "complete", 
            output
        });
    } catch (error) {
        self.postMessage({
            status: "error",
            error: error.message,
        });
    }
});