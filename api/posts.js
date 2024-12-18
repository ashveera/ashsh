const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const { title, content, wordpressToken, featuredImageUrl } = req.body;

    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    try {
        if (!wordpressToken) throw new Error("Missing WordPress token.");
        if (!title || !content || !featuredImageUrl) throw new Error("Missing required fields.");

        // Step 1: Upload Image
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`);
        const imageBuffer = await imageResponse.buffer();

        const uploadResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Type": "image/jpeg",
                "Content-Disposition": 'attachment; filename="featured-image.jpg"',
            },
            body: imageBuffer,
        });

        const mediaData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${JSON.stringify(mediaData)}`);

        const featuredMediaId = mediaData.id;

        // Step 2: Create Post
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({
                title,
                content,
                status: "publish",
                featured_media: featuredMediaId,
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) throw new Error(`Post creation failed: ${JSON.stringify(postData)}`);

        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
