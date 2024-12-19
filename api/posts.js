
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
  const { title, content, status, wordpressToken } = req.body; // Receive WordPress key
    const postUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
    const mediaUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/media";
    const { title, content, status, wordpressToken } = req.body;
    const featuredImageUrl = "https://source.unsplash.com/800x400/?fitness,human"; // Image URL passed via index

    try {
        if (!wordpressToken) {
            throw new Error("Missing WordPress API token.");
        }

    const response = await fetch(targetUrl, {
        let featuredImageId = null;

        // Step 1: Fetch and Upload Featured Image
        const imageResponse = await fetch(featuredImageUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch the featured image.");

        const imageBuffer = await imageResponse.buffer(); // Convert image to buffer
        const mediaResponse = await fetch(mediaUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${wordpressToken}`,
                "Content-Disposition": 'attachment; filename="featured-image.jpg"',
                "Content-Type": "image/jpeg",
            },
            body: imageBuffer, // Upload image
        });

        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) {
            throw new Error(`Failed to upload image: ${mediaData.message}`);
        }

        featuredImageId = mediaData.id; // Get uploaded image ID

        // Step 2: Create WordPress Post with Featured Image
        const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
 module.exports = async (req, res) => {
                title,
                content,
                status: status || "publish",
                featured_media: featuredImageId, // Attach the uploaded image
            }),
        });

    const data = await response.text(); // Parse response as text to handle errors

    if (!response.ok) {
      console.error("WordPress API Error:", data); // Log full error response
      throw new Error(`WordPress API Error: ${data}`);
        const postData = await postResponse.json();
        if (!postResponse.ok) {
            throw new Error(`Failed to create post: ${postData.message}`);
        }

    res.status(200).json({ success: true, link: JSON.parse(data).guid.rendered });
        res.status(200).json({ success: true, link: postData.link });
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({ error: error.message || "An unknown error occurred." });

