const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        // Allow only POST requests
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Extract required fields from the request body
        const { title, content, imagePrompt, wordpressToken, openAIKey } = req.body;

        // Validate input
        if (!wordpressToken || !openAIKey || !title || !content) {
            return res.status(400).json({
                error: "Missing required fields: wordpressToken, openAIKey, title, or content.",
            });
        }

        let featuredImageId = null;

        // Step 1: Generate and upload featured image (if imagePrompt is provided)
        if (imagePrompt) {
            try {
                // Generate image using DALL·E
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
                    throw new Error(
                        `Image generation failed: ${imageData.error?.message || "Unknown error"}`
                    );
                }

                const dallEImageUrl = imageData.data[0].url;

                // Upload generated image to WordPress
                const uploadResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Disposition": `attachment; filename="featured-image.jpg"`,
                        "Content-Type": "application/octet-stream",
                    },
                    body: await fetch(dallEImageUrl).then((res) => res.buffer()), // Download and pass image as a buffer
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(
                        `Image upload failed: ${uploadData.message || "Unknown error"}`
                    );
                }

                // Extract the uploaded image's ID for the post
                featuredImageId = uploadData.id;
            } catch (error) {
                console.warn("Image generation/upload failed:", error.message);
            }
        }

        // Step 2: Create post in WordPress
        try {
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
                    featured_media: featuredImageId || undefined, // Only include if an image was uploaded
                }),
            });

            const postData = await postResponse.json();

            if (!postResponse.ok) {
                throw new Error(
                    `Post creation failed: ${postData.message || "Unknown error"}`
                );
            }

            // Respond with success and post link
            res.status(200).json({
                success: true,
                link: postData.link,
                imageUrl: featuredImageId ? postData.guid.rendered : null,
            });
        } catch (error) {
            console.error("Post creation failed:", error.message);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        // General error handling
        console.error("Server error:", error.message);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
