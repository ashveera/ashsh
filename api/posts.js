const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken, openAIKey } = req.body;

        if (!wordpressToken || !openAIKey || !title || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, openAIKey, title, or content.",
            });
        }

        console.log("Received Request:", { title, content, status });

        let updatedContent = "";

        // Split content into paragraphs and generate images
        const paragraphs = content.split("\n").filter((para) => para.trim() !== "");
        for (const paragraph of paragraphs) {
            updatedContent += `<p>${paragraph}</p>`;

            try {
                console.log("Generating image for paragraph:", paragraph);

                const dallEResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openAIKey}`,
                    },
                    body: JSON.stringify({
                        prompt: `Create an image representing: ${paragraph}`,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const dallEData = await dallEResponse.json();

                if (!dallEResponse.ok || !dallEData.data || !dallEData.data[0]?.url) {
                    throw new Error("DALL·E image generation failed.");
                }

                const dallEImageUrl = dallEData.data[0].url;
                console.log("Generated Image URL:", dallEImageUrl);

                // Add the image to the content
                updatedContent += `<img src="${dallEImageUrl}" alt="Image for paragraph" style="margin: 10px 0; width: 100%; border-radius: 8px;">`;
            } catch (error) {
                console.warn("Image generation failed for paragraph:", error.message);
            }
        }

        console.log("Updated Content with Images:", updatedContent);

        // Create the post in WordPress
        try {
            const postResponse = await fetch(postUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${wordpressToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content: updatedContent,
                    status: status || "publish",
                }),
            });

            const postData = await postResponse.json();

            if (!postResponse.ok) {
                throw new Error(postData.message || "Failed to create post.");
            }

            console.log("Post created successfully:", postData.link);
            res.status(200).json({ success: true, link: postData.link });
        } catch (error) {
            console.error("Post creation failed:", error.message);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        console.error("General Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
