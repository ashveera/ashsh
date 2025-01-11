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

        // Create the initial post on WordPress without images
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                content, // Add the raw content here
                status: status || "draft", // Save as draft initially
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post.");
        }

        const postId = postData.id;
        console.log("Post created successfully with ID:", postId);

        // Respond to the user immediately to avoid timeout
        res.status(200).json({ success: true, link: postData.link });

        // Start generating images asynchronously for the paragraphs
        const paragraphs = content.split("\n").filter((para) => para.trim() !== "");

        for (const paragraph of paragraphs) {
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
                    // Download the image
                    const imageDownloadResponse = await fetch(imageUrl);
                    const imageBuffer = await imageDownloadResponse.buffer();

                    // Upload the image to WordPress
                    const uploadedMediaResponse = await fetch(mediaUrl, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${wordpressToken}`,
                            "Content-Disposition": `attachment; filename="paragraph-image.jpg"`,
                            "Content-Type": "image/jpeg",
                        },
                        body: imageBuffer,
                    });

                    const uploadedMediaData = await uploadedMediaResponse.json();

                    if (uploadedMediaResponse.ok && uploadedMediaData.id) {
                        console.log(
                            `Image for paragraph uploaded successfully with ID: ${uploadedMediaData.id}`
                        );

                        // Update the post content with the image
                        await fetch(`${postUrl}/${postId}`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${wordpressToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                content: `${content}<img src="${uploadedMediaData.source_url}" alt="Generated Image">`,
                            }),
                        });
                    }
                }
            } catch (error) {
                console.warn("Image generation or upload failed for paragraph:", error.message);
            }
        }
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error." });
    }
};
