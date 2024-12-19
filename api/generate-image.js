const fetch = require("node-fetch");

let imageTasks = {}; // Temporary in-memory storage for simplicity

module.exports = async (req, res) => {
    const openAIUrl = "https://api.openai.com/v1/images/generations";
    const { keywords, openAIKey } = req.body;

    const taskId = `${Date.now()}-${Math.random()}`; // Unique task ID
    imageTasks[taskId] = { status: "in-progress" };

    try {
        // Trigger DALL·E API
        const openAIResponse = await fetch(openAIUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                prompt: `Generate a visually appealing image related to: ${keywords}`,
                n: 1,
                size: "1024x1024",
            }),
        });

        if (!openAIResponse.ok) {
            const errorData = await openAIResponse.json();
            imageTasks[taskId] = { status: "error", error: errorData.error.message };
            throw new Error(`OpenAI API Error: ${errorData.error.message}`);
        }

        const openAIData = await openAIResponse.json();
        imageTasks[taskId] = { status: "completed", imageUrl: openAIData.data[0].url };

        res.status(200).json({ taskId });
    } catch (error) {
        console.error("Image Generation Error:", error.message || error);
        imageTasks[taskId] = { status: "error", error: error.message };
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};

// Polling Endpoint
module.exports.pollStatus = async (req, res) => {
    const { taskId } = req.query;

    if (!imageTasks[taskId]) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(imageTasks[taskId]);
};
