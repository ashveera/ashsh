const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Parse the incoming request body
        const { title, content, status, wordpressToken, imageUrl, imagePrompt } = req.body;

        // Validate required fields
        if (!wordpressToken || !title || !content) {
            return res.status(400).json({ error: "Missing required fields: wordpressToken, title, or content." });
        }

        console.log("Received Request:", { title, content, status, imageUrl, imagePrompt });

        let featuredMediaId;

        // Step 1: Handle image upload or generation
        if (imageUrl) {
            try {
                console.log("Fetching image from URL:", imageUrl);
                const imageResponse = await fetch(imageUrl);

                if (!imageResponse.ok) {
                    throw new Error('Failed to fetch image: ${imageResponse.statusText}');
                }

                const imageBuffer = await imageResponse.buffer();
                const imageMimeType = imageResponse.headers.get("content-type");

                if (!["image/jpeg", "image/png"].includes(imageMimeType)) {
                    throw new Error("Unsupported image type. Only JPEG and PNG are allowed.");
                }

                console.log("Uploading image to WordPress...");
                const uploadResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Type": imageMimeType,
                        "Content-Disposition": `attachment; filename="featured-image.${imageMimeType.split("/")[1]}"`,
                    },
                    body: imageBuffer,
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.message || "Image upload failed.");
                }

                featuredMediaId = uploadData.id;
                console.log("Image uploaded successfully with ID:", featuredMediaId);
            } catch (error) {
                console.warn("Image upload failed. Skipping featured media:", error.message);
                featuredMediaId = null;
            }
        } else if (imagePrompt) {
            try {
                console.log("Generating image using DALL·E with prompt:", imagePrompt);

                const dallEResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const dallEData = await dallEResponse.json();

                if (!dallEResponse.ok || !dallEData.data || !dallEData.data[0]?.url) {
                   
