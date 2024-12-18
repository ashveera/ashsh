const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const { title, content, status, wordpressToken } = req.body;
    const featuredImageUrl = "https://source.unsplash.com/800x400/?fitness,human";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";

    try {
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

        // Step 1: Fetch and upload the featured image
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch the featured image. Status: ${imageResponse.status}`);
        }

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
            throw new Error(`Failed to upload image. WordPress response: ${JSON.stringify(mediaData)}`);
        }

        const featuredImageId = mediaData.id;

        // Step 2: Create WordPress post with the uploaded image
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
            throw new Error(`Failed to create post. WordPress response: ${JSON.stringify(postData)}`);
        }

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error occurred:", error.message);
        res.status(500).json({ error: error.message });
    }
};
