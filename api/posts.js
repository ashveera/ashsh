const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const { title, content, keywords } = req.body;
    const wordpressToken = "YOUR_WORDPRESS_API_TOKEN"; // Replace with your WordPress token
    const openAiApiKey = "YOUR_OPENAI_API_KEY"; // Replace with your OpenAI API key

    if (!wordpressToken || !openAiApiKey) {
        return res.status(400).json({ error: "Missing API keys." });
    }

    try {
        // Step 1: Generate AI Image using OpenAI's DALL·E
        const aiImageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify({
                prompt: `A high-quality, realistic image of a person exercising, fitness activities, with no text on the image. Focus on ${keywords}.`,
                n: 1,
                size: "800x400",
            }),
        });

        const aiImageData = await aiImageResponse.json();
        if (!aiImageResponse.ok || !aiImageData.data || !aiImageData.data[0]) {
            throw new Error("Failed to generate AI image.");
        }

        const aiImageUrl = aiImageData.data[0].url;

        // Step 2: Download and Upload Image to WordPress
        const imageResponse = await fetch(aiImageUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch the AI-generated image.");

        const imageBuffer = await imageResponse.buffer();
        const mediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Disposition": 'attachment; filename="featured-image.jpg"',
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer,
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) {
            throw new Error(`Failed to upload image: ${mediaData.message}`);
        }

        const featuredImageId = mediaData.id;

        // Step 3: Create WordPress Post with Featured Image
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
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
            throw new Error(`Failed to create post: ${postData.message}`);
        }

        res.status(200).json({ success: true, link: postData.link, imageUrl: aiImageUrl });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
