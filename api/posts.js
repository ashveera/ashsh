const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const { title, content, status, wordpressToken, imageUrl } = req.body;

    try {
        if (!wordpressToken || !imageUrl) throw new Error("Missing API tokens or image URL.");

        console.log("Step 1: Uploading Image to WordPress...");
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch the generated image.");

        const imageBuffer = await imageResponse.buffer();

        const mediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Disposition": 'attachment; filename="generated-image.jpg"',
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer,
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) {
            throw new Error(`WordPress Media Upload Error: ${mediaData.message}`);
        }

        const featuredImageId = mediaData.id;

        console.log("Step 2: Creating WordPress Post...");
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
            throw new Error(`WordPress Post Creation Error: ${postData.message}`);
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Post Creation Error:", error.message || error);
        res.status(500).json({ error: error.message || "Unknown server error" });
    }
};
