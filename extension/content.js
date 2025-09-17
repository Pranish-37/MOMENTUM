// content.js - Momentum Gmail integration

(function () {
  console.log("[Momentum] Content script loaded for Gmail");
  console.log("[Momentum] Location:", window.location.href);

  let currentCommitment = null;
  let sidePanel = null;

  // Initialize authentication on load
  chrome.runtime.sendMessage({ type: "INIT_AUTH" }, (response) => {
    console.log("[Momentum] Auth initialization:", response);
  });

  // Enhanced email text extraction utilities
  function extractGmailBodyText() {
    console.log("[Momentum] Extracting Gmail body text...");

    // Multiple selectors to find email content
    const bodySelectors = [
      "div.a3s",           // Main email body
      "div.ii.gt div",     // Alternative body selector
      ".a3s.aiL",          // Expanded email body
      ".ii.gt",            // Message container
      "[data-message-id]", // Message with ID
      ".adn.ads"           // Another Gmail body selector
    ];

    for (const selector of bodySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element && element.innerText && element.innerText.trim().length > 10) {
          const text = element.innerText.trim();
          console.log("[Momentum] Using Gmail body text:", text.substring(0, 100) + "...");
          return text;
        }
      }
    }

    // Fallback: try to get any visible text from the main content area
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      const text = mainContent.innerText.trim();
      if (text && text.length > 10) {
        console.log("[Momentum] Using fallback text extraction");
        return text;
      }
    }

    console.log("[Momentum] No email text found");
    return null;
  }

  function getUserSelection() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      console.log("[Momentum] Using selected text");
      return selection.toString().trim();
    }
    return null;
  }

  function getEmailText() {
    const userSelection = getUserSelection();
    if (userSelection) return userSelection;

    const bodyText = extractGmailBodyText();
    if (bodyText) return bodyText;

    console.log("[Momentum] Could not extract any email text");
    return null;
  }

  function getThreadId() {
    const urlMatch = location.href.match(/\/([a-f0-9]+)$/);
    return urlMatch ? urlMatch[1] : null;
  }

  // Create Momentum side panel
  function createSidePanel() {
    if (sidePanel) return sidePanel;

    sidePanel = document.createElement('div');
    sidePanel.className = 'momentum-side-panel';
    sidePanel.innerHTML = `
      <div class="momentum-panel-header">
        <button class="momentum-close" id="momentum-close-btn">&times;</button>
        <div class="momentum-logo">Momentum</div>
        <div class="momentum-tagline">From email to done</div>
      </div>

      <div class="momentum-section">
        <h3>Parse & Edit</h3>
        <div id="momentum-commitment-type">
          <span class="momentum-chip i-owe">I-Owe</span>
        </div>
        <input type="text" id="momentum-title" class="momentum-input" placeholder="Task title" />
        <input type="datetime-local" id="momentum-deadline" class="momentum-input" />
        <div class="momentum-confidence">
          <span id="momentum-confidence-text">Confidence: 85%</span>
          <button class="momentum-view-source" id="momentum-view-source-btn">view source</button>
        </div>
      </div>

      <div class="momentum-section">
        <h3>Actions</h3>
        <button class="momentum-button secondary" id="momentum-test-api-btn">🔧 Test Google API</button>
        <button class="momentum-button" id="momentum-plan-this-btn">Plan This (45m)</button>
        <button class="momentum-button secondary" id="momentum-propose-slots-btn">Propose 3 Slots</button>
        <button class="momentum-button secondary" id="momentum-draft-bump-btn" style="display:none;">Draft Bump</button>
      </div>

      <div class="momentum-section">
        <h3>Checklist & Outputs</h3>
        <div id="momentum-checklist"></div>
        <div class="momentum-toggle">
          <input type="checkbox" id="toggle-prep" checked />
          <label for="toggle-prep">Prep block</label>
        </div>
        <div class="momentum-toggle">
          <input type="checkbox" id="toggle-task" checked />
          <label for="toggle-task">Task</label>
        </div>
        <div class="momentum-toggle">
          <input type="checkbox" id="toggle-draft" checked />
          <label for="toggle-draft">Draft</label>
        </div>
        <div id="momentum-output-links"></div>
      </div>

      <div class="momentum-footer">
        <button class="momentum-button secondary" id="momentum-snooze-btn">Snooze 30m</button>
        <button class="momentum-button secondary" id="momentum-replan-btn">Re-plan</button>
        <button class="momentum-button" id="momentum-done-btn">Mark done</button>
      </div>
    `;

    // Add event listeners for all buttons
    sidePanel.querySelector('#momentum-close-btn').addEventListener('click', () => {
      sidePanel.classList.remove('visible');
    });

    sidePanel.querySelector('#momentum-view-source-btn').addEventListener('click', highlightSourceText);
    sidePanel.querySelector('#momentum-test-api-btn').addEventListener('click', testGoogleApi);
    sidePanel.querySelector('#momentum-plan-this-btn').addEventListener('click', planThis);
    sidePanel.querySelector('#momentum-propose-slots-btn').addEventListener('click', proposeSlots);
    sidePanel.querySelector('#momentum-draft-bump-btn').addEventListener('click', createWaitingOn);

    document.body.appendChild(sidePanel);
    return sidePanel;
  }


  // Open Momentum panel and parse commitment
  function openMomentumPanel() {
    console.log("[Momentum] Opening Momentum panel...");

    const emailText = getEmailText();
    if (!emailText) {
      console.log("[Momentum] No email text found");
      alert("Could not find any email text to analyze. Make sure you're viewing an email.");
      return;
    }

    console.log("[Momentum] Found email text, creating panel...");
    const panel = createSidePanel();
    panel.classList.add('visible');

    console.log("[Momentum] Parsing commitment...");
    // Parse commitment
    chrome.runtime.sendMessage({
      type: "PARSE_COMMITMENT",
      payload: {
        emailText: emailText,
        threadId: getThreadId()
      }
    }, (response) => {
      console.log("[Momentum] Background response:", response);
      if (response && response.status === "ok") {
        currentCommitment = response.commitment;
        updatePanelWithCommitment(currentCommitment);
      } else {
        console.error("[Momentum] Parse failed:", response);
        alert("Failed to parse email content. Check console for details.");
      }
    });
  }

  // Update panel with parsed commitment
  function updatePanelWithCommitment(commitment) {
    document.getElementById('momentum-title').value = commitment.title;

    // Convert deadline to local datetime format
    const deadline = new Date(commitment.deadline);
    const localDatetime = deadline.toISOString().slice(0, 16);
    document.getElementById('momentum-deadline').value = localDatetime;

    // Update confidence
    const confidencePercent = Math.round(commitment.confidence * 100);
    document.getElementById('momentum-confidence-text').textContent = `Confidence: ${confidencePercent}%`;

    // Update type chip and show/hide relevant buttons
    const typeChip = document.querySelector('.momentum-chip');
    const draftBumpBtn = document.getElementById('momentum-draft-bump-btn');

    if (commitment.type === 'waiting-on') {
      typeChip.className = 'momentum-chip waiting-on';
      typeChip.textContent = 'Waiting-On';
      if (draftBumpBtn) draftBumpBtn.style.display = 'inline-block';
    } else {
      typeChip.className = 'momentum-chip i-owe';
      typeChip.textContent = 'I-Owe';
      if (draftBumpBtn) draftBumpBtn.style.display = 'none';
    }
  }

  // Button click handlers
  function testGoogleApi() {
    console.log("[Momentum] Testing Google API connection...");
    chrome.runtime.sendMessage({ type: "TEST_API" }, (response) => {
      if (response && response.status === "ok") {
        console.log("[Momentum] API test successful:", response.result);
        alert(`✅ Google API Connected!\n\nEmail: ${response.result.profile.emailAddress}\nTotal Messages: ${response.result.profile.messagesTotal}`);
      } else {
        console.error("[Momentum] API test failed:", response);
        alert(`❌ Google API Test Failed:\n\n${response.error || 'Unknown error'}`);
      }
    });
  }

  function planThis() {
    if (!currentCommitment) return;

    const title = document.getElementById('momentum-title').value;
    const deadline = document.getElementById('momentum-deadline').value;
    const createTask = document.getElementById('toggle-task').checked;
    const createDraft = document.getElementById('toggle-draft').checked;

    currentCommitment.title = title;
    currentCommitment.deadline = new Date(deadline).toISOString();

    chrome.runtime.sendMessage({
      type: "PLAN_THIS",
      payload: {
        commitment: currentCommitment,
        prepTime: 45,
        createTask,
        createDraft
      }
    }, (response) => {
      if (response.status === "ok") {
        showOutputLinks(response.result);
      } else {
        console.error("Plan This failed:", response.error);
        alert("Failed to create plan: " + response.error);
      }
    });
  };

  function proposeSlots() {
    chrome.runtime.sendMessage({
      type: "PROPOSE_SLOTS",
      payload: { threadId: getThreadId() }
    }, (response) => {
      if (response.status === "ok") {
        console.log("Proposed slots:", response.result);
        alert("Meeting slots proposed! Check your drafts.");
      }
    });
  }

  function createWaitingOn() {
    if (!currentCommitment) return;

    chrome.runtime.sendMessage({
      type: "CREATE_WAITING_ON",
      payload: { commitment: currentCommitment }
    }, (response) => {
      if (response.status === "ok") {
        console.log("Waiting-on created:", response.result);
        alert("Waiting-on task and bump draft created!");
      }
    });
  }

  function highlightSourceText() {
    if (currentCommitment && currentCommitment.sourceText) {
      // Find and highlight the source text in the email
      const emailBody = document.querySelector("div.a3s, div.ii.gt div");
      if (emailBody) {
        const text = emailBody.innerHTML;
        const highlighted = text.replace(
          new RegExp(currentCommitment.sourceText, 'gi'),
          `<mark style="background: yellow;">${currentCommitment.sourceText}</mark>`
        );
        emailBody.innerHTML = highlighted;
      }
    }
  };

  function showOutputLinks(results) {
    const linksDiv = document.getElementById('momentum-output-links');
    let html = '<h4>Created:</h4>';

    if (results.calendarEvent) {
      html += `<p>📅 <a href="https://calendar.google.com" target="_blank">Calendar event created</a></p>`;
    }
    if (results.task) {
      html += `<p>✅ <a href="https://tasks.google.com" target="_blank">Task created</a></p>`;
    }
    if (results.draft) {
      html += `<p>✉️ <a href="https://mail.google.com/mail/u/0/#drafts" target="_blank">Draft created</a></p>`;
    }

    linksDiv.innerHTML = html;
  }

  // Add keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      openMomentumPanel();
    }
  });

  // Initialize when Gmail is ready
  function initWhenReady() {
    console.log("[Momentum] Checking if Gmail is ready...");

    // Multiple selectors to detect Gmail
    const gmailSelectors = [
      '[role="main"]',
      '.nH',
      '.aeR',
      '#\\:kc', // Gmail specific ID
      '.zA',    // Message list
      '.aAR'    // Gmail header
    ];

    const gmailDetected = gmailSelectors.some(selector => {
      const element = document.querySelector(selector);
      if (element) {
        console.log("[Momentum] Gmail detected via selector:", selector);
        return true;
      }
      return false;
    });

    if (gmailDetected || window.location.hostname === 'mail.google.com') {
      console.log("[Momentum] Gmail ready, creating button...");
      createTriggerButton();
    } else {
      console.log("[Momentum] Gmail not ready, retrying in 1s...");
      setTimeout(initWhenReady, 1000);
    }
  }

  // Enhanced button creation with better positioning
  function createTriggerButton() {
    if (document.getElementById("momentum-trigger")) {
      console.log("[Momentum] Button already exists");
      return;
    }

    console.log("[Momentum] Creating trigger button...");

    const btn = document.createElement("button");
    btn.id = "momentum-trigger";
    btn.className = "momentum-trigger-button";
    btn.innerHTML = "⚡ Momentum";
    btn.title = "Open Momentum (Ctrl+Shift+K)";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[Momentum] Button clicked!");
      openMomentumPanel();
    });

    // Try multiple insertion points
    const insertionPoints = [
      document.body,
      document.querySelector('.nH'),
      document.querySelector('[role="main"]'),
      document.documentElement
    ];

    for (const point of insertionPoints) {
      if (point) {
        point.appendChild(btn);
        console.log("[Momentum] Button created and attached to:", point.tagName);
        break;
      }
    }
  }

  // Start initialization with multiple attempts
  let initAttempts = 0;
  function startInit() {
    initAttempts++;
    console.log("[Momentum] Init attempt #", initAttempts);

    if (initAttempts > 10) {
      console.log("[Momentum] Max init attempts reached, creating button anyway...");
      createTriggerButton();
      return;
    }

    initWhenReady();
  }

  // Start initialization immediately and on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }

  // Also try after a short delay for dynamic content
  setTimeout(startInit, 2000);

})();
