const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

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

        console.log("Received Request:", { title, status });

        // Generate featured image using OpenAI DALL·E
        const featureImagePrompt = `Create a high-quality featured image for an article titled "${title}"`;
        const featureImageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                prompt: featureImagePrompt,
                n: 1,
                size: "1024x1024",
            }),
        });

        const featureImageData = await featureImageResponse.json();

        if (!featureImageResponse.ok || !featureImageData.data || !featureImageData.data[0]?.url) {
            throw new Error("DALL·E featured image generation failed.");
        }

        const featureImageUrl = featureImageData.data[0].url;
        console.log("Generated Featured Image URL:", featureImageUrl);

        // Upload the featured image to WordPress
        const imageResponse = await fetch(featureImageUrl);
        const imageBuffer = await imageResponse.buffer();

        const uploadedMediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Disposition": `attachment; filename="feature-image.jpg"`,
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer,
        });

        const uploadedMediaData = await uploadedMediaResponse.json();

        if (!uploadedMediaResponse.ok || !uploadedMediaData.id) {
            throw new Error("Failed to upload featured image to WordPress.");
        }

        const featureImageId = uploadedMediaData.id;
        console.log("Feature Image uploaded successfully, ID:", featureImageId);

        // Prepare content with asynchronous image generation for each paragraph
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
                        prompt: `Illustrate: ${paragraph}`,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const imageData = await imageResponse.json();
                const imageUrl = imageData.data?.[0]?.url;

                if (imageUrl) {
                    updatedContent += `<img src="${imageUrl}" alt="Generated Image" style="margin: 10px 0; width: 100%; border-radius: 8px;">`;
                }
            } catch (error) {
                console.warn("Image generation failed for paragraph:", error.message);
            }
        }

        // Create the WordPress post with the updated content and featured image
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
                featured_media: featureImageId, // Attach the featured image
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post.");
        }

        console.log("Post created successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
