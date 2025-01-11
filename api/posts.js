const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const openAIEndpoint = "https://api.openai.com/v1/chat/completions";
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, wordpressToken, openAIKey } = req.body;

        if (!wordpressToken || !openAIKey || !title || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, openAIKey, title, or content.",
            });
        }

        console.log("Generating content using OpenAI...");

        // Step 1: Generate content from OpenAI
        const openAIResponse = await fetch(openAIEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content, // Pass the content prompt directly to OpenAI
                    },
                ],
                max_tokens: 1000,
            }),
        });

        const openAIData = await openAIResponse.json();

        if (!openAIResponse.ok || !openAIData.choices || !openAIData.choices[0]?.message?.content) {
            throw new Error("Failed to generate content using OpenAI.");
        }

        const generatedContent = openAIData.choices[0].message.content;
        console.log("Generated Content:", generatedContent);

        // Step 2: Create the post in WordPress
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content: generatedContent, // Use the generated content
                status: "publish", // Publish the post
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post in WordPress.");
        }

        console.log("Post created successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
