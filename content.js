// Global References
let summaryButton = null;
let emailObserver = null;

// 1. Button Management
function createSummaryButton() {
    if (summaryButton) return;
    
    summaryButton = document.createElement('div');
summaryButton.id = 'email-summary-assistant-btn';
summaryButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 80px;
    background: #4285f4;
    color: white;
    padding: 8px 17px;
    border-radius: 17px;
    cursor: pointer;
    box-shadow: 0 3px 9px rgba(0,0,0,0.2);
    z-index: 2147483647;
    font-family: 'Google Sans', Arial;
    font-weight: 500;
    font-size: 0.875rem;
    display: none;
`;
summaryButton.textContent = 'Summarize Email';

    
    // Add to DOM
    document.body.appendChild(summaryButton);
    console.log('Summary button created');
}

function toggleButton(show) {
    if (!summaryButton) {
        console.warn('Button not initialized');
        return;
    }
    summaryButton.style.display = show ? 'block' : 'none';
    console.log(`Button visibility: ${show}`);
}

// 2. Email Content Detection
function checkEmailOpen() {
    try {
        const emailContent = document.querySelector([
            '[role="article"]',          // New Gmail
            '.a3s.aiL',                  // Classic Gmail
            '.ii.gt',                     // Thread view
            '[aria-label="Message Body"]' // Mobile
        ].join(','));
        
        return emailContent?.textContent?.length > 100;
    } catch (error) {
        console.error('Content check error:', error);
        return false;
    }
}

// 3. Mutation Observer
function setupEmailObserver() {
    if (emailObserver) return;

    emailObserver = new MutationObserver(() => {
        const isOpen = checkEmailOpen();
        toggleButton(isOpen);
    });

    emailObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
    });
}

// 4. Click Handler
async function handleSummaryClick() {
    if (!summaryButton) return;

    try {
        // Visual feedback
        summaryButton.style.opacity = '0.7';
        summaryButton.textContent = 'Summarizing...';
        summaryButton.style.pointerEvents = 'none';

        // Get content
        const emailContent = document.querySelector([
            '[role="article"]', 
            '.a3s.aiL', 
            '.ii.gt'
        ].join(','));
        
        if (!emailContent) throw new Error('No email content found');
        
        // Send to background
        const { summary, error } = await chrome.runtime.sendMessage({
            action: 'getSummary',
            text: emailContent.textContent.substring(0, 15000)
        });

        if (error) throw new Error(error);
        showPopup(summary);
    } catch (error) {
        console.error('Summary failed:', error);
        showErrorPopup(error.message);
    } finally {
        if (summaryButton) {
            summaryButton.style.opacity = '1';
            summaryButton.style.pointerEvents = 'auto';
            summaryButton.textContent = 'Summarize Email';
        }
    }
}

// 5. Initialization
(function init() {
    // Create button immediately
    createSummaryButton();
    
    // Setup observers
    setupEmailObserver();
    
    // Initial check
    setTimeout(() => toggleButton(checkEmailOpen()), 1000);
    
    // Add click listener
    if (summaryButton) {
        summaryButton.addEventListener('click', handleSummaryClick);
    } else {
        console.error('Failed to initialize button');
    }
    
    // Cleanup on unload
    window.addEventListener('unload', () => {
        if (emailObserver) emailObserver.disconnect();
        if (summaryButton) summaryButton.remove();
    });
})();

// Popup Management Functions
function showPopup(content) {
    // Remove existing popup if any
    const existingPopup = document.getElementById('summary-popup');
    if (existingPopup) existingPopup.remove();
    
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'summary-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2147483646;
        max-width: 600px;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Popup content
    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">Email Summary</h3>
            <button id="close-popup" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0 8px;
            ">×</button>
        </div>
        <div style="line-height: 1.5; white-space: pre-wrap;">${content}</div>
    `;
    
    // Close functionality
    popup.querySelector('#close-popup').addEventListener('click', () => popup.remove());
    
    // Close when clicking outside
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483645;
        background: rgba(0,0,0,0.3);
    `;
    overlay.addEventListener('click', () => {
        popup.remove();
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    popup.textContent = `Error: ${message}`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
}