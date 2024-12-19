const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const featuredImageUrl = "https://source.unsplash.com/800x400/?fitness,human";
    const { title, content, status, wordpressToken } = req.body;

    try {
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

        // Step 1: Upload Featured Image
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch the featured image.");
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

        // Step 2: Create WordPress Post
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
                featured_media: featuredImageId,
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`Failed to create post: ${postData.message}`);
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Server Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
