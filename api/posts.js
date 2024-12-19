const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const openAIUrl = "https://api.openai.com/v1/images/generations";
    const { title, content, status, wordpressToken, keywords, openAIKey } = req.body;

    console.log("Received Request Body:", req.body);

    try {
        if (!wordpressToken || !openAIKey) {
            throw new Error("Missing API tokens (WordPress or OpenAI).");
        }

        console.log("Step 1: Generating Image with OpenAI DALL·E...");
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
        const generatedImageUrl = openAIData.data[0].url;
        console.log("Generated Image URL:", generatedImageUrl);

        console.log("Step 2: Uploading Image to WordPress...");
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
            throw new Error(`WordPress Media Upload Error: ${mediaData.message}`);
        }

        const featuredImageId = mediaData.id;
        console.log("Uploaded Image ID:", featuredImageId);

        console.log("Step 3: Creating WordPress Post...");
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
                featured_media: featuredImageId,
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`WordPress Post Creation Error: ${postData.message}`);
        }

        console.log("Post Created Successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Server Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
