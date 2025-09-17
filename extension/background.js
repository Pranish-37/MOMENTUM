// background.js - Momentum service worker for MV3

console.log("[Momentum] Background service worker loaded");
console.log("[Momentum] Extension ID:", chrome.runtime.id);

let authToken = null;

// OAuth and API helper functions
async function getAuthToken() {
  if (authToken) {
    console.log("[Momentum] Using cached auth token");
    return authToken;
  }

  console.log("[Momentum] Getting new auth token...");
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("[Momentum] Auth error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        authToken = token;
        console.log("[Momentum] Got auth token:", token ? "✅ Success" : "❌ Failed");
        resolve(token);
      }
    });
  });
}

async function makeGoogleApiCall(endpoint, method = 'GET', body = null) {
  console.log(`[Momentum] Making ${method} request to:`, endpoint);
  const token = await getAuthToken();

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
    console.log("[Momentum] Request body:", body);
  }

  try {
    const response = await fetch(endpoint, options);
    console.log(`[Momentum] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Momentum] API Error:", errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[Momentum] API Success:", result);
    return result;
  } catch (error) {
    console.error("[Momentum] API Call failed:", error);
    throw error;
  }
}

// Google Tasks API functions
async function createTasksList(title) {
  const endpoint = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
  return await makeGoogleApiCall(endpoint, 'POST', { title });
}

async function createTask(taskListId, task) {
  const endpoint = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
  return await makeGoogleApiCall(endpoint, 'POST', task);
}

// Google Calendar API functions
async function createCalendarEvent(event) {
  const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  return await makeGoogleApiCall(endpoint, 'POST', event);
}

async function getFreeBusy(timeMin, timeMax) {
  const endpoint = 'https://www.googleapis.com/calendar/v3/freeBusy';
  return await makeGoogleApiCall(endpoint, 'POST', {
    timeMin,
    timeMax,
    items: [{ id: 'primary' }]
  });
}

// Gmail API functions
async function createDraft(draft) {
  const endpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts';
  return await makeGoogleApiCall(endpoint, 'POST', draft);
}

// Enhanced commitment parsing function
function parseCommitmentFromText(emailText) {
  if (!emailText) {
    return {
      type: "i-owe",
      title: "No email content found",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      confidence: 0.1,
      sourceText: "No text available"
    };
  }

  console.log("[Momentum] Analyzing text:", emailText.substring(0, 200) + "...");

  // Simple deadline detection patterns
  const deadlinePatterns = [
    /by ([A-Za-z]+day)\b/i,  // "by Friday"
    /by (\d{1,2}\/\d{1,2})/,  // "by 12/15"
    /due ([A-Za-z]+day)\b/i,  // "due Monday"
    /deadline.*?(\d{1,2}\/\d{1,2})/i,  // "deadline is 12/15"
    /no later than ([A-Za-z]+day)/i,   // "no later than Friday"
    /before ([A-Za-z]+day)/i,          // "before Monday"
    /EOD/i,  // End of day
    /tomorrow/i,
    /next week/i
  ];

  let deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days
  let confidence = 0.5;
  let sourceText = "Email content";
  let type = "i-owe";

  // Check for deadline mentions
  for (const pattern of deadlinePatterns) {
    const match = emailText.match(pattern);
    if (match) {
      console.log("[Momentum] Found deadline pattern:", match[0]);
      sourceText = match[0];
      confidence = 0.75;

      // Simple date parsing
      if (match[0].toLowerCase().includes('tomorrow')) {
        deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (match[0].toLowerCase().includes('friday')) {
        // Find next Friday
        const today = new Date();
        const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
        deadline = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
      } else if (match[0].toLowerCase().includes('monday')) {
        // Find next Monday
        const today = new Date();
        const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
        deadline = new Date(today.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
      }
      break;
    }
  }

  // Detect task type based on content
  const waitingPatterns = [
    /please send/i,
    /can you provide/i,
    /waiting for/i,
    /need from you/i,
    /when will/i
  ];

  for (const pattern of waitingPatterns) {
    if (emailText.match(pattern)) {
      type = "waiting-on";
      break;
    }
  }

  // Extract a reasonable title
  let title = "Process email request";
  const sentences = emailText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    title = sentences[0].trim().substring(0, 50);
    if (title.length === 50) title += "...";
  }

  // Look for specific invoice/payment context
  if (emailText.toLowerCase().includes('invoice') && emailText.toLowerCase().includes('past due')) {
    title = "Process past due invoice payment";
    type = "i-owe";
    confidence = 0.9;
  }

  return {
    type,
    title,
    deadline: deadline.toISOString(),
    confidence,
    sourceText
  };
}

// Initialize task lists on first run
async function initializeTaskLists() {
  try {
    const storage = await chrome.storage.local.get(['momentumTaskLists']);

    if (!storage.momentumTaskLists) {
      console.log("[Momentum] Creating task lists for first time");

      const iOweList = await createTasksList("Momentum — I Owe");
      const waitingOnList = await createTasksList("Momentum — Waiting On");

      await chrome.storage.local.set({
        momentumTaskLists: {
          iOwe: iOweList.id,
          waitingOn: waitingOnList.id
        }
      });

      console.log("[Momentum] Task lists created successfully");
    }
  } catch (error) {
    console.error("[Momentum] Failed to initialize task lists:", error);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Momentum] Received message:", message.type);
  console.log("[Momentum] From sender:", sender.tab?.url || "popup/background");

  if (message.type === "INIT_AUTH") {
    console.log("[Momentum] Initializing authentication...");
    initializeTaskLists()
      .then(() => {
        console.log("[Momentum] Auth initialization successful");
        sendResponse({ status: "ok", message: "Authentication initialized" });
      })
      .catch(error => {
        console.error("[Momentum] Auth initialization failed:", error);
        sendResponse({ status: "error", error: error.message });
      });
    return true; // async response
  }

  if (message.type === "PARSE_COMMITMENT") {
    console.log("[Momentum] Parsing commitment...");
    const { emailText, threadId } = message.payload;

    console.log("[Momentum] Email text length:", emailText?.length || 0);
    console.log("[Momentum] Thread ID:", threadId);

    // Enhanced commitment parsing with better detection
    const commitment = parseCommitmentFromText(emailText);

    console.log("[Momentum] Parsed commitment:", commitment);

    sendResponse({
      status: "ok",
      commitment: commitment
    });
    return true;
  }

  if (message.type === "PLAN_THIS") {
    console.log("[Momentum] Handling Plan This request...");
    handlePlanThis(message.payload)
      .then(result => {
        console.log("[Momentum] Plan This completed successfully");
        sendResponse({ status: "ok", result });
      })
      .catch(error => {
        console.error("[Momentum] Plan This failed:", error);
        sendResponse({ status: "error", error: error.message });
      });
    return true; // async response
  }

  if (message.type === "TEST_API") {
    console.log("[Momentum] Testing Google API connection...");
    testGoogleApiConnection()
      .then(result => sendResponse({ status: "ok", result }))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true; // async response
  }

  if (message.type === "PROPOSE_SLOTS") {
    handleProposeSlots(message.payload)
      .then(result => sendResponse({ status: "ok", result }))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true; // async response
  }

  if (message.type === "CREATE_WAITING_ON") {
    handleWaitingOn(message.payload)
      .then(result => sendResponse({ status: "ok", result }))
      .catch(error => sendResponse({ status: "error", error: error.message }));
    return true; // async response
  }

  sendResponse({ status: "unhandled" });
});

// Test Google API connection
async function testGoogleApiConnection() {
  console.log("[Momentum] Testing Google API connection...");
  try {
    // Test with a simple Gmail API call
    const response = await makeGoogleApiCall('https://gmail.googleapis.com/gmail/v1/users/me/profile');
    console.log("[Momentum] API test successful:", response);
    return {
      success: true,
      message: "Google API connection working",
      profile: response
    };
  } catch (error) {
    console.error("[Momentum] API test failed:", error);
    throw error;
  }
}

// Core Momentum flow handlers
async function handlePlanThis(payload) {
  const { commitment, prepTime = 45, createTask = true, createDraft = true } = payload;
  const storage = await chrome.storage.local.get(['momentumTaskLists']);

  const results = {};

  // Create prep blocks in calendar
  const deadline = new Date(commitment.deadline);
  const prepStartTime = new Date(deadline.getTime() - prepTime * 60 * 1000);

  const calendarEvent = {
    summary: `Prep: ${commitment.title}`,
    start: { dateTime: prepStartTime.toISOString() },
    end: { dateTime: deadline.toISOString() },
    description: `Preparation time for: ${commitment.title}`
  };

  results.calendarEvent = await createCalendarEvent(calendarEvent);

  // Create task if requested
  if (createTask && storage.momentumTaskLists) {
    const task = {
      title: commitment.title,
      due: deadline.toISOString(),
      notes: `Deadline: ${deadline.toLocaleString()}`
    };

    results.task = await createTask(storage.momentumTaskLists.iOwe, task);
  }

  // Create draft if requested
  if (createDraft) {
    const draftContent = {
      message: {
        raw: btoa(`Subject: Re: Confirming deadline\n\nConfirming ${deadline.toLocaleString()} deadline for: ${commitment.title}\n\nI've blocked preparation time and will have this ready by the deadline.`)
      }
    };

    results.draft = await createDraft(draftContent);
  }

  return results;
}

async function handleProposeSlots(payload) {
  // Implementation for proposing meeting slots
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days

  const freeBusy = await getFreeBusy(timeMin, timeMax);

  // Logic to find 3 free slots would go here
  // For now, return mock slots
  return {
    slots: [
      { start: "2025-09-18T10:00:00", end: "2025-09-18T11:00:00" },
      { start: "2025-09-18T14:00:00", end: "2025-09-18T15:00:00" },
      { start: "2025-09-19T09:00:00", end: "2025-09-19T10:00:00" }
    ]
  };
}

async function handleWaitingOn(payload) {
  const { commitment, bumpAfterDays = 3 } = payload;
  const storage = await chrome.storage.local.get(['momentumTaskLists']);

  const dueDate = new Date(Date.now() + bumpAfterDays * 24 * 60 * 60 * 1000);

  const task = {
    title: `Follow up: ${commitment.title}`,
    due: dueDate.toISOString(),
    notes: `Waiting for response on: ${commitment.title}`
  };

  const createdTask = await createTask(storage.momentumTaskLists.waitingOn, task);

  // Create bump draft
  const draftContent = {
    message: {
      raw: btoa(`Subject: Re: Following up\n\nHi,\n\nJust following up on: ${commitment.title}\n\nLet me know if you need any additional information.\n\nBest regards`)
    }
  };

  const draft = await createDraft(draftContent);

  return { task: createdTask, draft };
}
