const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const targetUrl = "https://fitnessbodybuildingvolt.com/wp-json/wp/v2/posts";
  const { title, content, status, wordpressToken } = req.body; // Receive WordPress key

  try {
    if (!wordpressToken) {
      throw new Error("Missing WordPress API token.");
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wordpressToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        status: status || "publish",
      }),
    });

    const data = await response.text(); // Parse response as text to handle errors

    if (!response.ok) {
      console.error("WordPress API Error:", data); // Log full error response
      throw new Error(`WordPress API Error: ${data}`);
    }

    res.status(200).json({ success: true, link: JSON.parse(data).guid.rendered });
  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
