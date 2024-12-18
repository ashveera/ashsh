const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const { title, content, status, wordpressToken } = req.body;

    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        // Check for WordPress Token
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

        // Step 1: Generate AI Image using OpenAI DALL·E API
        console.log("Generating AI Image...");
        const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer YOUR_OPENAI_API_KEY`, // Replace with OpenAI Key
            },
            body: JSON.stringify({
                prompt: "A human fitness workout scene, realistic, no text, high quality",
                n: 1,
                size: "1024x1024",
            }),
        });

        const dalleData = await dalleResponse.json();
        if (!dalleResponse.ok || !dalleData.data || !dalleData.data[0].url) {
            throw new Error(`Failed to generate AI image: ${JSON.stringify(dalleData)}`);
        }

        const featuredImageUrl = dalleData.data[0].url;
        console.log(`Generated Image URL: ${featuredImageUrl}`);

        // Step 2: Fetch the Generated Image from OpenAI
        console.log("Fetching Generated Image...");
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch AI-generated image. Status: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.buffer();

        // Step 3: Upload Image to WordPress Media Library
        console.log("Uploading Image to WordPress...");
        const mediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`, // WordPress Token
                "Content-Disposition": 'attachment; filename="featured-image.jpg"',
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer,
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok || !mediaData.id) {
            throw new Error(`Failed to upload image. WordPress response: ${JSON.stringify(mediaData)}`);
        }

        const featuredImageId = mediaData.id;
        console.log(`Uploaded Image ID: ${featuredImageId}`);

        // Step 4: Create WordPress Post with Featured Image
        console.log("Creating WordPress Post...");
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({
                title,
                content,
                status: status || "publish",
                featured_media: featuredImageId, // Attach uploaded image as featured media
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`Failed to create post. WordPress response: ${JSON.stringify(postData)}`);
        }

        console.log("Post created successfully!");
        res.status(200).json({
            success: true,
            message: "Post created successfully!",
            link: postData.link,
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
