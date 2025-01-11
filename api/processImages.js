const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { postId, content, wordpressToken, openAIKey } = req.body;

        if (!wordpressToken || !openAIKey || !postId || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, openAIKey, postId, or content.",
            });
        }

        const paragraphs = content.split("\n").filter((para) => para.trim() !== "");
        let updatedContent = "";

        for (const paragraph of paragraphs) {
            updatedContent += `<p>${paragraph}</p>`;

            try {
                const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openAIKey}`,
                    },
                    body: JSON.stringify({
                        prompt: `Create an illustration for: ${paragraph}`,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const imageData = await imageResponse.json();

                if (imageResponse.ok && imageData.data[0]?.url) {
                    const imageUrl = imageData.data[0].url;

                    const imageBuffer = await (await fetch(imageUrl)).buffer();

                    const uploadedMediaResponse = await fetch(mediaUrl, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${wordpressToken}`,
                            "Content-Disposition": `attachment; filename="paragraph-image.jpg"`,
                            "Content-Type": "image/jpeg",
                        },
                        body: imageBuffer,
                    });

                    const uploadedMediaData = await uploadedMediaResponse.json();

                    if (uploadedMediaResponse.ok && uploadedMediaData.source_url) {
                        updatedContent += `<img src="${uploadedMediaData.source_url}" alt="Generated Image">`;
                    }
                }
            } catch (error) {
                console.warn("Image processing failed for paragraph:", error.message);
            }
        }

        const updateResponse = await fetch(`${postUrl}/${postId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: updatedContent }),
        });

        if (!updateResponse.ok) {
            const updateError = await updateResponse.json();
            throw new Error(updateError.message || "Failed to update post.");
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
