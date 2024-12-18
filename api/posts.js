const fetch = require("node-fetch");

module.exports = async (req, res) => {
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";

    const { title, content, status, wordpressToken, featuredImageUrl } = req.body;

    try {
        // Validation: Check for required fields
        if (!wordpressToken) throw new Error("Missing WordPress API token.");
        if (!featuredImageUrl) throw new Error("Missing featured image URL.");

        let featuredImageId = null;

        // Step 1: Fetch and Upload the Featured Image
        console.log("Fetching the image...");
        const imageResponse = await fetch(featuredImageUrl);

        if (!imageResponse.ok) {
            console.error("Image Fetch Error:", await imageResponse.text());
            throw new Error(`Failed to fetch the image. Status: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.buffer();
        console.log("Image fetched successfully. Uploading to WordPress...");

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
        if (!mediaResponse.ok || !mediaData.id) {
            console.error("Image Upload Error:", mediaData);
            throw new Error(`Failed to upload image. WordPress response: ${JSON.stringify(mediaData)}`);
        }

        featuredImageId = mediaData.id;
        console.log(`Image uploaded successfully. Image ID: ${featuredImageId}`);

        // Step 2: Create a WordPress Post with the Image
        console.log("Creating the WordPress post...");
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wordpressToken}`,
            },
            body: JSON.stringify({
                title: title || "Untitled Post",
                content: content || "No content provided",
                status: status || "publish",
                featured_media: featuredImageId,
            }),
        });

        const postData = await postResponse.json();
        if (!postResponse.ok) {
            console.error("Post Creation Error:", postData);
            throw new Error(`Failed to create post. WordPress response: ${JSON.stringify(postData)}`);
        }

        console.log("Post created successfully!");
        res.status(200).json({
            success: true,
            message: "Post created successfully!",
            link: postData.link,
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};
