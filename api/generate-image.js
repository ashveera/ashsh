const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const openAIUrl = "https://api.openai.com/v1/images/generations";
    const { keywords, openAIKey } = req.body;

    try {
        if (!openAIKey) throw new Error("Missing OpenAI API key.");

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
            throw new Error(`OpenAI API Error: ${errorData.error.message}`);
        }

        const openAIData = await openAIResponse.json();
        res.status(200).json({ imageUrl: openAIData.data[0].url });
    } catch (error) {
        console.error("Image Generation Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
