const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const openAIUrl = "https://api.openai.com/v1/images/generations";
    const { title, content, status, wordpressToken, keywords, openAIKey } = req.body;

    try {
        if (!wordpressToken || !openAIKey) {
            throw new Error("Missing API tokens (WordPress or OpenAI).");
        }

        // Step 1: Generate Image with OpenAI DALL·E
        let generatedImageUrl;
        try {
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

            const openAIData = await openAIResponse.json();
            if (!openAIResponse.ok) {
                throw new Error(`Failed to generate image: ${openAIData.error.message}`);
            }

            generatedImageUrl = openAIData.data[0].url; // URL of the generated image
        } catch (openAIError) {
            console.error("Image Generation Error:", openAIError.message || openAIError);
            generatedImageUrl = null; // Proceed without a generated image
        }

        // Step 2: Upload the Generated Image to WordPress
        let featuredImageId = null;
        if (generatedImageUrl) {
            try {
                const imageResponse = await fetch(generatedImageUrl);
                if (!imageResponse.ok) throw new Error("Failed to fetch the generated image.");

                const imageBuffer = await imageResponse.buffer();

                const mediaResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Disposition": 'attachment; filename="generated-image.jpg"',
                        "Content-Type": "image/jpeg",
                    },
                    body: imageBuffer,
                });

                const mediaData = await mediaResponse.json();
                if (!mediaResponse.ok) {
                    throw new Error(`Failed to upload image: ${mediaData.message}`);
                }

                featuredImageId = mediaData.id; // Get uploaded image ID
            } catch (uploadError) {
                console.error("Image Upload Error:", uploadError.message || uploadError);
                featuredImageId = null; // Proceed without a featured image
            }
        }

        // Step 3: Create WordPress Post
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content,
                status: status || "publish",
                ...(featuredImageId && { featured_media: featuredImageId }),
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`Failed to create post: ${postData.message}`);
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Server Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
