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

        // Generate featured image
        const featureImagePrompt = "Illustrate a high-quality featured image for the article titled: " + title;
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

        // Download the feature image for upload to WordPress
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
            throw new Error("Failed to upload feature image to WordPress.");
        }

        const featureImageId = uploadedMediaData.id;
        console.log("Feature Image uploaded successfully, ID:", featureImageId);

        // Create the post in WordPress with the featured image
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
