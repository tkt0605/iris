// FastAPI バックエンド（/api/llm）を呼び出すWorker
// backendUrl と token はメインスレッドから postMessage で受け取る
self.addEventListener('message', async (event) => {
    try {
        const { userText, conversationHistory, token, backendUrl } = event.data;
        const url = `${backendUrl}/api/llm`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ userText, conversationHistory: conversationHistory || [] }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || err.error || "API Error");
        }

        const { reply, title } = await response.json();

        self.postMessage({ status: "complete", type: "reply", output: reply });
        self.postMessage({ status: "complete", type: "title", output: title });
    } catch (error) {
        console.error('LLM Worker Error:', error);
        self.postMessage({ status: "error", error: String(error) });
    }
});
