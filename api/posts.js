const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken, imageUrl, imagePrompt } = req.body;

        if (!wordpressToken || !title || !content) {
            return res.status(400).json({ error: "Missing required fields: wordpressToken, title, or content." });
        }

        console.log("Received Request:", { title, content, status, imageUrl, imagePrompt });

        let featuredMediaId;

        // Step 1: Handle image upload/generation
        if (imageUrl) {
            try {
                console.log("Fetching image from URL:", imageUrl);
                const imageResponse = await fetch(imageUrl);

                if (!imageResponse.ok) {
throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);

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
                        Authorization: Bearer ${wordpressToken},
                        "Content-Type": imageMimeType,
                        "Content-Disposition": attachment; filename="featured-image.${imageMimeType.split("/")[1]}",
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
                        Authorization: Bearer ${process.env.OPENAI_API_KEY},
                    },
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const dallEData = await dallEResponse.json();

                if (!dallEResponse.ok || !dallEData.data || !dallEData.data[0]?.url) {
                    throw new Error("DALL·E image generation failed.");
                }

                const dallEImageUrl = dallEData.data[0].url;
                console.log("Generated Image URL:", dallEImageUrl);

                const dallEImageResponse = await fetch(dallEImageUrl);
                const dallEImageBuffer = await dallEImageResponse.buffer();

                console.log("Uploading generated image to WordPress...");
                const uploadResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: Bearer ${wordpressToken},
                        "Content-Type": "image/png",
                        "Content-Disposition": attachment; filename="dalle-image.png",
                    },
                    body: dallEImageBuffer,
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.message || "Generated image upload failed.");
                }

                featuredMediaId = uploadData.id;
                console.log("Generated image uploaded successfully with ID:", featuredMediaId);
            } catch (error) {
                console.warn("DALL·E image generation/upload failed:", error.message);
                featuredMediaId = null;
            }
        }

        // Step 2: Create the post in WordPress
        try {
            console.log("Creating post in WordPress...");
            const postResponse = await fetch(postUrl, {
                method: "POST",
                headers: {
                    Authorization: Bearer ${wordpressToken},
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content,
                    status: status || "publish",
                    featured_media: featuredMediaId || undefined,
                }),
            });

            const postData = await postResponse.json();

            if (!postResponse.ok) {
                throw new Error(postData.message || "Failed to create post.");
            }

            console.log("Post created successfully:", postData.link);
            res.status(200).json({ success: true, link: postData.link });
        } catch (error) {
            console.error("Post creation failed:", error.message);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        console.error("General Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};