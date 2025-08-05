

export default defineBackground(() => {
  console.log('CodeMate background script loaded');
  
  // Handle real-time code updates from content script
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type === "CODE_UPDATED") {
      console.log("Code updated, generating live hint...");
      
      try {
        // Get the current tab info to extract problem details
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        // Send message to content script to get full page data
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_LEETCODE_CODE" },
          async (response) => {
            if (response && !response.error) {
              // Get stored API key
              chrome.storage.local.get(["GEMINI_API_KEY"], async (result) => {
                if (result.GEMINI_API_KEY) {
                  const hint = await fetchLiveHintFromAPI({
                    code: msg.code,
                    title: response.title,
                    description: response.description,
                    apiKey: result.GEMINI_API_KEY
                  });
                  
                  // Send hint back to popup
                  chrome.runtime.sendMessage({ 
                    type: "LIVE_HINT", 
                    hint 
                  });
                }
              });
            }
          }
        );
      } catch (error) {
        console.error("Error generating live hint:", error);
        chrome.runtime.sendMessage({ 
          type: "LIVE_HINT", 
          hint: "Error generating live hint." 
        });
      }
    }
  });
});

// Function to fetch live hints from your server
async function fetchLiveHintFromAPI({ code, title, description, apiKey }) {
  try {
    const response = await fetch("http://localhost:3000/hint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        code,
        title,
        description,
        prompt: "Provide a quick live hint as the user is typing. Keep it brief and encouraging.",
        hintType: "live"
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.hint || "Keep coding! You're on the right track.";
  } catch (error) {
    console.error("Error fetching live hint:", error);
    return "Live hints temporarily unavailable.";
  }
}
