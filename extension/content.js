// content.js

(function () {
  console.log("[AI Calendar Assistant] content.js loaded");

  // Utility: extract text from Gmail email body
  function extractGmailBodyText() {
    // Gmail email bodies usually live in a div with class 'a3s'
    const bodyElement = document.querySelector("div.a3s");
    if (bodyElement) {
      return bodyElement.innerText.trim();
    }
    return null;
  }

  // Utility: get user selection if any
  function getUserSelection() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return selection.toString().trim();
    }
    return null;
  }

  // Main extraction function
  function extractEmailText() {
    const selectedText = getUserSelection();
    if (selectedText) {
      console.log("[AI Calendar Assistant] Using selected text:", selectedText);
      return selectedText;
    }

    const gmailBodyText = extractGmailBodyText();
    if (gmailBodyText) {
      console.log("[AI Calendar Assistant] Using Gmail body text:", gmailBodyText.slice(0, 200), "...");
      return gmailBodyText;
    }

    console.warn("[AI Calendar Assistant] No email body found.");
    return null;
  }

  // Add a floating button in the email UI
  function injectScanButton() {
    if (document.getElementById("ai-calendar-btn")) return; // Prevent duplicates

    const btn = document.createElement("button");
    btn.id = "ai-calendar-btn";
    btn.innerText = "📅 Scan for Events";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = 9999;
    btn.style.padding = "10px 15px";
    btn.style.background = "#1a73e8";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

    btn.addEventListener("click", () => {
      const text = extractEmailText();
      if (text) {
        chrome.runtime.sendMessage({
          type: "EXTRACT_REQUEST",
          payload: {
            source: "gmail",
            url: location.href,
            bodyText: text,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }, (response) => {
          console.log("[AI Calendar Assistant] Background response:", response);
        });
      } else {
        alert("Could not find any text in this email.");
      }
    });

    document.body.appendChild(btn);
  }

  // Run on load
  window.addEventListener("load", () => {
    injectScanButton();
  });
})();
