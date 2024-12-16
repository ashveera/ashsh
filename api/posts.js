const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
  const { title, content, status, wordpressToken } = req.body; // Receive WordPress key

  try {
    // Ensure the WordPress token is provided
    if (!wordpressToken) {
      throw new Error("Missing WordPress API token.");
    }

    // Send request to WordPress API
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wordpressToken}`, // Use the token passed from index
      },
      body: JSON.stringify({
        title,
        content,
        status: status || "publish", // Default status is "publish"
      }),
    });

    // Parse and handle WordPress API response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`WordPress API Error: ${data.message}`);
    }

    res.status(200).json({ success: true, link: data.link });
  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
