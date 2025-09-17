// background.js (service worker for MV3)

console.log("[AI Calendar Assistant] background.js loaded");

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[AI Calendar Assistant] Received message:", message);

  if (message.type === "EXTRACT_REQUEST") {
    const { source, url, bodyText, timezone } = message.payload;

    console.log("[AI Calendar Assistant] Extract request details:");
    console.log("Source:", source);
    console.log("URL:", url);
    console.log("Timezone:", timezone);
    console.log("Body Text (first 200 chars):", bodyText.slice(0, 200));

    // Simulate event extraction (dummy example)
    const dummyEvent = {
      title: "Dummy Meeting",
      start: "2025-10-01T09:00:00",
      end: "2025-10-01T10:00:00",
      location: "Online",
      description: "This is just a placeholder response."
    };

    // Send response back to content script
    sendResponse({
      status: "ok",
      extracted: dummyEvent
    });

    // Important: return true if you plan async response, but here it's sync
    return true;
  }

  // Default case
  sendResponse({ status: "unhandled" });
  return false;
});
