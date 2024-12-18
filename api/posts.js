const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const { title, content, status, wordpressToken } = req.body;

    const unsplashApiUrl = "https://source.unsplash.com/800x400/?human,person,face";

    try {
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

        let featuredImageId = null;

        const imageResponse = await fetch(unsplashApiUrl);
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

        featuredImageId = mediaData.id;

        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
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
        res.status(500).json({ error: error.message });
    }
};
