self.addEventListener('message', async (event) => {
    try {
        const { userText, conversationHistory } = event.data;
        const apiUrl = process.env.LLM_API_URL;
        const response = await fetch(new URL("/api/llm", self.location.origin), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userText, conversationHistory }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "API Error");
        }

        const { reply, title } = await response.json();

        self.postMessage({
            status: "complete",
            type: "reply",
            output: reply,
        });
        self.postMessage({
            status: "complete",
            type: "title",
            output: title,
        });
    } catch (error) {
        console.error('LLM Worker Error:', error);
        self.postMessage({
            status: "error",
            error: String(error),
        });
    }
});