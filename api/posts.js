const express = require("express");
const fetch = require("node-fetch");
const FileType = require("file-type");

const app = express();
app.use(express.json());

const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

app.post("/api/generate", async (req, res) => {
    const { keywords, contentType, tone, audience, wordCount, seoKeywords, openAIKey } = req.body;

    if (!openAIKey || !keywords || !contentType || !tone || !audience || !wordCount) {
        return res.status(400).json({ error: "Missing required fields for content generation." });
    }

    try {
        const prompt = `Write a ${tone} ${contentType.replace("_", " ")} targeting ${audience} with the following keywords: ${keywords}. SEO Keywords: ${seoKeywords}. Word Count: ${wordCount}.`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
            }),
        });

        if (!aiResponse.ok) {
            throw new Error("Failed to generate content from OpenAI API.");
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        const imageUrl = `https://source.unsplash.com/800x400/?${keywords.replace(/\s+/g, ",")}`;

        if (!content) {
            throw new Error("No content received from OpenAI.");
        }

        res.status(200).json({ content, imageUrl });
    } catch (error) {
        console.error("Error generating content:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/posts", async (req, res) => {
    const { title, content, status, wordpressToken, imageUrl } = req.body;

    if (!wordpressToken || !title || !content) {
        return res.status(400).json({ error: "Missing required fields for post creation." });
    }

    try {
        let featuredMediaId;

        // Upload the image to WordPress if imageUrl is provided
        if (imageUrl) {
            try {
                const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());
                const fileType = await FileType.fromBuffer(imageBuffer);

                if (!fileType || !["image/jpeg", "image/png"].includes(fileType.mime)) {
                    throw new Error("Unsupported image type. Only JPEG and PNG are allowed.");
                }

                const imageResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Type": fileType.mime,
                        "Content-Disposition": `attachment; filename="featured-image.${fileType.ext}"`,
                    },
                    body: imageBuffer,
                });

                const imageData = await imageResponse.json();

                if (!imageResponse.ok) {
                    throw new Error(imageData.message || "Failed to upload image.");
                }

                featuredMediaId = imageData.id;
            } catch (error) {
                console.warn("Image upload failed. Skipping featured media:", error.message);
            }
        }

        // Create the post in WordPress
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
                featured_media: featuredMediaId || undefined,
            }),
        });

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create post.");
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error creating post:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
