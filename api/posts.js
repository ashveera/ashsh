const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, imagePrompt, wordpressToken, openAIKey } = req.body;

        if (!wordpressToken || !openAIKey || !title || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, openAIKey, title, or content.",
            });
        }

        let featuredImageId = null;

        if (imagePrompt) {
            try {
                const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openAIKey}`,
                    },
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const imageData = await imageResponse.json();

                if (!imageResponse.ok || !imageData.data || !imageData.data[0]?.url) {
                    throw new Error("Failed to generate image.");
                }

                const dallEImageUrl = imageData.data[0].url;

                const uploadResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Disposition": `attachment; filename="featured-image.jpg"`,
                    },
                    body: await fetch(dallEImageUrl).then((res) => res.buffer()),
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.message || "Failed to upload image to WordPress.");
                }

                featuredImageId = uploadData.id;
            } catch (error) {
                console.warn("Image generation/upload failed:", error.message);
            }
        }

        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content,
                status: "publish",
                featured_media: featuredImageId,
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post.");
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("General Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
