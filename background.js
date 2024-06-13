let currentTabId = null;
let currentStartTime = null;
let timeSpent = {};

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(activeInfo => {
    updateCurrentTab(activeInfo.tabId);
});

// Listen for tab updates (e.g., page load complete)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === currentTabId && changeInfo.status === 'complete') {
        currentStartTime = new Date();
    }
});

// Listen for tab removal (closing a tab)
chrome.tabs.onRemoved.addListener(tabId => {
    if (tabId === currentTabId) {
        updateCurrentTab(null);
    }
});

// Listen for replacing a tab (replacing an existing tab with a new one)
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    if (removedTabId === currentTabId) {
        updateCurrentTab(addedTabId);
    }
});

// Handle messages (e.g., request to get time spent data)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeSpent") {
        updateCurrentTab(currentTabId);
        sendResponse(timeSpent);
    }
});

function updateCurrentTab(newTabId) {
    if (currentTabId !== null && currentStartTime !== null) {
        // Calculate time spent on the current tab
        const timeSpentOnSite = (new Date() - currentStartTime) / 1000;

        // Get the URL of the current tab and update timeSpent
        chrome.tabs.get(currentTabId, tab => {
            if (!chrome.runtime.lastError && tab) {
                const url = new URL(tab.url);
                const domain = url.hostname;

                // Update time spent on the domain
                if (!timeSpent[domain]) {
                    timeSpent[domain] = 0;
                }
                timeSpent[domain] += timeSpentOnSite;

                // Save time spent data to local storage
                chrome.storage.local.set({ timeSpent: timeSpent }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving timeSpent to local storage:", chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.error("Error getting tab info:", chrome.runtime.lastError ? chrome.runtime.lastError.message : "Tab not found");
            }

            // Set the new current tab and reset the start time
            currentTabId = newTabId;
            currentStartTime = newTabId ? new Date() : null;
        });
    } else {
        // Set the new current tab and reset the start time
        currentTabId = newTabId;
        currentStartTime = newTabId ? new Date() : null;
    }
}
