const fetch = require("node-fetch");
const FileType = require("file-type");

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { title, content, status, wordpressToken, imageUrl } = req.body;

        if (!wordpressToken || !title || !content) {
            return res.status(400).json({ error: "Missing required fields: wordpressToken, title, or content" });
        }

        console.log("Received request:", { title, content, status, imageUrl });

        let featuredMediaId;

        // Step 1: Upload the image to WordPress if imageUrl is provided
        if (imageUrl) {
            try {
                const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());
                const fileType = await FileType.fromBuffer(imageBuffer);

                if (!fileType || !["image/jpeg", "image/png"].includes(fileType.mime)) {
                    throw new Error("Unsupported image type. Only JPEG and PNG are allowed.");
                }

                const mediaResponse = await fetch(
                    "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${wordpressToken}`,
                            "Content-Type": fileType.mime,
                            "Content-Disposition": `attachment; filename="featured-image.${fileType.ext}"`,
                        },
                        body: imageBuffer,
                    }
                );

                const mediaData = await mediaResponse.json();

                if (!mediaResponse.ok) {
                    throw new Error(mediaData.message || "Image upload failed.");
                }

                featuredMediaId = mediaData.id;
                console.log("Image uploaded with ID:", featuredMediaId);
            } catch (error) {
                console.warn("Image upload failed. Skipping featured media:", error.message);
                featuredMediaId = null;
            }
        }

        // Step 2: Create the post in WordPress
        const postResponse = await fetch(
            "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts",
            {
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
            }
        );

        const postData = await postResponse.json();

        if (!postResponse.ok) {
            throw new Error(postData.message || "Failed to create WordPress post.");
        }

        console.log("Post created successfully:", postData.link);
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: error.message || "Internal server error." });
    }
};
