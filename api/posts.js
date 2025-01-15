// Import fetch (use native if available)
const fetch = globalThis.fetch || require("node-fetch");
const FileType = require("file-type");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken, imageUrl } = req.body;

        if (!wordpressToken || !title || !content) {
            return res.status(400).json({ error: "Missing required fields: wordpressToken, title, or content" });
        }

        console.log("Received Request:", { title, content, status, imageUrl });

        let featuredMediaId;

        // Image upload logic (if applicable)
        if (imageUrl) {
            try {
                const imageBuffer = await fetch(imageUrl).then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch image: ${res.statusText}`);
                    }
                    return res.buffer();
                });

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
                    throw new Error(imageData.message || "Image upload failed");
                }

                featuredMediaId = imageData.id; // Get the attachment ID for the uploaded media
                console.log("Uploaded Image ID:", featuredMediaId);
            } catch (err) {
                console.error("Image Upload Error:", err.message);
                return res.status(500).json({ error: err.message });
            }
        }

        // Post creation logic
        try {
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
                throw new Error(postData.message || "Failed to create post");
            }

            console.log("WordPress Post Created Successfully:", postData.link);
            res.status(200).json({ success: true, link: postData.link });
        } catch (err) {
            console.error("Post Creation Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    } catch (error) {
        console.error("General Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
