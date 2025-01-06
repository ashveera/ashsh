const fetch = require("node-fetch");
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

        // Step 1: Validate and upload the image to WordPress
        if (imageUrl) {
            try {
                // Fetch the image from the provided URL
                const imageResponse = await fetch(imageUrl);

                if (!imageResponse.ok) {
                    throw new Error(`Image fetch failed with status: ${imageResponse.status}`);
                }

                const imageBuffer = await imageResponse.buffer();
                const fileType = await FileType.fromBuffer(imageBuffer);

                if (!fileType || !["image/jpeg", "image/png"].includes(fileType.mime)) {
                    throw new Error("Unsupported image type. Only JPEG and PNG are allowed.");
                }

                // Upload the image to WordPress
                const uploadResponse = await fetch(mediaUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${wordpressToken}`,
                        "Content-Type": fileType.mime,
                        "Content-Disposition": `attachment; filename="featured-image.${fileType.ext}"`,
                    },
                    body: imageBuffer,
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadData.message || "Image upload failed");
                }

                featuredMediaId = uploadData.id;
                console.log("Uploaded Image ID:", featuredMediaId);
            } catch (error) {
                console.warn("Image upload failed. Skipping featured media.", error.message);
                featuredMediaId = undefined; // Skip featured media if upload fails
            }
        }

        // Step 2: Create the post in WordPress
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
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
