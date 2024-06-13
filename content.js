// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "blockSite") {
        // Check if the site_disabled div already exists
        let disabledDiv = document.querySelector('body > .site_disabled');
        
        if (!disabledDiv) {
            // Create a new div element
            disabledDiv = document.createElement('div');
            disabledDiv.className = 'site_disabled';
            disabledDiv.innerHTML = "This site has been disabled.";
            
            // Insert the div immediately after the body tag
            document.body.insertAdjacentElement('afterbegin', disabledDiv);
        }
    }
});