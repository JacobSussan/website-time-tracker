let tabInfo = {}; // Object to store information about each tab
let timeSpent = {}; // Object to store accumulated time for each domain

let IDLE_TIME_THRESHOLD = 15; // Idle threshold in seconds
const trackWhenIdleSites = ["youtube.com", "netflix.com", "hulu.com", "disneyplus.com"];

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(activeInfo => {
    updateTabInfo(activeInfo.tabId);
});

// Listen for tab updates (e.g., page load complete)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateTabInfo(tabId);
    }
});

// Listen for tab removal (closing a tab)
chrome.tabs.onRemoved.addListener(tabId => {
    if (tabInfo[tabId]) {
        accumulateTime(tabId);
        delete tabInfo[tabId];
    }
});

// Listen for replacing a tab (replacing an existing tab with a new one)
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    if (tabInfo[removedTabId]) {
        accumulateTime(removedTabId);
        delete tabInfo[removedTabId];
    }
    updateTabInfo(addedTabId);
});

// Handle messages (e.g., request to get time spent data)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeSpent") {
        getTimeSpentData(sendResponse);
        return true; // Indicate asynchronous response
    }
});

// Set up a timer to periodically check for idle tabs and accumulate time
setInterval(() => {
    const now = Date.now();
    chrome.tabs.query({ active: true }, tabs => {
        tabs.forEach(tab => {
            if (tabInfo[tab.id]) {
                accumulateTime(tab);
            } else {
                // If no info about the tab, initialize it
                tabInfo[tab.id] = { timeSpent: 0, url: tab.url };
            }
        });
    });
}, 1000);

// Helper function to get domain from URL
function getDomain(url) {
    if (url) {
        return (new URL(url)).hostname.replace('www.', '');
    } else {
        return null;
    }
}

// Helper function to update tab information
function updateTabInfo(tabId) {
    chrome.tabs.get(tabId, tab => {
        if (tab) {
            if (tabInfo[tabId]) {
                // Update the URL in case it changed
                tabInfo[tabId].url = tab.url;
            } else {
                tabInfo[tabId] = { timeSpent: 0, url: tab.url };
            }
        }
    });
}

// Helper function to accumulate time spent on a domain
function accumulateTime(tab) {
    const domain = getDomain(tab.url);
    let idle = (((Date.now() - tab.lastAccessed) / 1000) > IDLE_TIME_THRESHOLD);

    // Check if it's idle or not a tracked when idle site
    if (!idle || trackWhenIdleSites.includes(domain)) {
        if (tabInfo[tab.id]) {
            if (domain) {
                if (!timeSpent[domain]) {
                    timeSpent[domain] = 0;
                }
                timeSpent[domain]++;
            }
        }
    }
}

// Function to get accumulated time spent data
function getTimeSpentData(callback) {
    // Clone the timeSpent object to send as a response
    const timeSpentCopy = { ...timeSpent };

    // Include active tab times in the response
    for (const tabId in tabInfo) {
        if (tabInfo.hasOwnProperty(tabId)) {
            const domain = getDomain(tabInfo[tabId].url);
            if (!timeSpentCopy[domain]) {
                timeSpentCopy[domain] = 0;
            }
            timeSpentCopy[domain] += tabInfo[tabId].timeSpent;
        }
    }
    callback(timeSpentCopy);
}
