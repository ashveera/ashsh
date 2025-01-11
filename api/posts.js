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

        // Split content into paragraphs
        const paragraphs = content.split("\n").filter((para) => para.trim() !== "");
        let updatedContent = "";

        // Generate images for each paragraph and add to content
        for (const paragraph of paragraphs) {
            updatedContent += `<p>${paragraph}</p>`;

            try {
                console.log("Generating image for paragraph:", paragraph);

                // Generate image using OpenAI DALL·E
                const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${openAIKey}`,
                    },
                    body: JSON.stringify({
                        prompt: `Create an illustration for: ${paragraph}`,
                        n: 1,
                        size: "512x512",
                    }),
                });

                const imageData = await imageResponse.json();

                if (!imageResponse.ok || !imageData.data || !imageData.data[0]?.url) {
                    throw new Error("Image generation failed.");
                }

                const imageUrl = imageData.data[0].url;
                console.log("Generated Image URL:", imageUrl);

                // Download the generated image
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

                if (!uploadedMediaResponse.ok || !uploadedMediaData.id) {
                    throw new Error("Failed to upload image to WordPress.");
                }

                const uploadedImageUrl = uploadedMediaData.source_url;
                console.log("Uploaded Image URL:", uploadedImageUrl);

                // Add the image to the content
                updatedContent += `<img src="${uploadedImageUrl}" alt="Generated Image" style="margin: 10px 0; width: 100%; border-radius: 8px;">`;
            } catch (error) {
                console.warn("Image generation or upload failed for paragraph:", error.message);
            }
        }

        // Create the post in WordPress with updated content and images
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
