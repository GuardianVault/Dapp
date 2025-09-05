// Guardian Vault Browser Extension Background Script
// Handles communication between popup, content scripts, and web pages

const GUARDIAN_VAULT_ORIGINS = [
  'http://127.0.0.1:4943',
  'http://localhost:3000',
  'https://*.ic0.app',
  'https://*.icp0.io',
  'https://*.internetcomputer.org'
];

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Guardian Vault extension installed/updated:', details.reason);
  
  // Set up initial state
  chrome.storage.local.set({
    lastActivity: Date.now(),
    connectionStatus: 'ready',
    extensionVersion: chrome.runtime.getManifest().version
  });
  
  // Create context menu for quick access
  chrome.contextMenus.create({
    id: 'guardian-vault-quick-send',
    title: 'Send with Guardian Vault',
    contexts: ['selection'],
    documentUrlPatterns: ['https://*/*', 'http://*/*']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'guardian-vault-quick-send') {
    // Extract selected text (could be a Principal ID or Bitcoin address)
    const selectedText = info.selectionText;
    
    // Open popup with pre-filled recipient
    chrome.action.openPopup().then(() => {
      // Send selected text to popup
      chrome.runtime.sendMessage({
        type: 'PREFILL_RECIPIENT',
        recipient: selectedText
      });
    }).catch(console.error);
  }
});

// Message handling for popup, content scripts, and web pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from:', sender);
  
  switch (message.type) {
    case 'PING':
      sendResponse({ type: 'PONG', timestamp: Date.now() });
      break;
      
    case 'GET_EXTENSION_INFO':
      sendResponse({
        type: 'EXTENSION_INFO',
        version: chrome.runtime.getManifest().version,
        id: chrome.runtime.id
      });
      break;
      
    case 'STORE_AUTH_DATA':
      // Securely store authentication data
      chrome.storage.local.set({
        authData: message.data,
        lastAuth: Date.now()
      });
      sendResponse({ success: true });
      break;
      
    case 'GET_AUTH_DATA':
      chrome.storage.local.get(['authData', 'lastAuth'], (result) => {
        sendResponse({
          authData: result.authData,
          lastAuth: result.lastAuth
        });
      });
      return true; // Keep message channel open for async response
      
    case 'CLEAR_AUTH_DATA':
      chrome.storage.local.remove(['authData', 'lastAuth']);
      sendResponse({ success: true });
      break;
      
    case 'OPEN_WEB_APP':
      openWebApp();
      sendResponse({ success: true });
      break;
      
    case 'GET_CURRENT_TAB_INFO':
      getCurrentTabInfo().then(sendResponse);
      return true;
      
    case 'INJECT_GUARDIAN_VAULT':
      // Inject Guardian Vault functionality into current page
      injectContentScript(message.tabId);
      sendResponse({ success: true });
      break;
      
    case 'WALLET_TRANSACTION':
      // Handle wallet transactions from content scripts
      handleWalletTransaction(message.data, sender)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Handle external messages from web pages
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message received:', message, 'from:', sender);
  
  // Verify the sender is from allowed origins
  const senderOrigin = new URL(sender.url).origin;
  const isAllowed = GUARDIAN_VAULT_ORIGINS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(senderOrigin);
    }
    return pattern === senderOrigin;
  });
  
  if (!isAllowed) {
    sendResponse({ error: 'Origin not allowed' });
    return;
  }
  
  // Handle external requests
  switch (message.type) {
    case 'REQUEST_CONNECTION':
      sendResponse({
        connected: true,
        extensionId: chrome.runtime.id,
        version: chrome.runtime.getManifest().version
      });
      break;
      
    case 'REQUEST_WALLET_INFO':
      getWalletInfo().then(sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown external message type' });
  }
});

// Tab updates - detect Guardian Vault compatible sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    
    // Check if this is a Guardian Vault compatible site
    const isGuardianVaultSite = GUARDIAN_VAULT_ORIGINS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url.origin);
      }
      return pattern === url.origin;
    });
    
    if (isGuardianVaultSite) {
      // Update badge to show extension is available
      chrome.action.setBadgeText({ tabId, text: '◉' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#29ABE2' });
      
      // Inject content script for enhanced functionality
      injectContentScript(tabId);
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});

// Alarm for periodic tasks
chrome.alarms.create('guardian-vault-heartbeat', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'guardian-vault-heartbeat') {
    // Update last activity
    chrome.storage.local.set({ lastActivity: Date.now() });
    
    // Clean up old data if needed
    cleanupOldData();
  }
});

// Helper functions
async function openWebApp() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = process.env.DFX_NETWORK === 'local' 
      ? `http://127.0.0.1:4943/?canisterId=${process.env.CANISTER_ID_GUARDIAN_VAULT_FRONTEND}`
      : 'https://guardian-vault.icp0.io';
    
    await chrome.tabs.create({ url });
  } catch (error) {
    console.error('Failed to open web app:', error);
  }
}

async function getCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      isGuardianVaultCompatible: isGuardianVaultCompatible(tab.url)
    };
  } catch (error) {
    console.error('Failed to get current tab info:', error);
    return { error: error.message };
  }
}

function isGuardianVaultCompatible(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return GUARDIAN_VAULT_ORIGINS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(urlObj.origin);
      }
      return pattern === urlObj.origin;
    });
  } catch {
    return false;
  }
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
  } catch (error) {
    console.log('Content script injection failed (expected for some sites):', error.message);
  }
}

async function handleWalletTransaction(transactionData, sender) {
  try {
    // Validate transaction data
    if (!transactionData || !transactionData.type) {
      throw new Error('Invalid transaction data');
    }
    
    // Store transaction request for popup to handle
    await chrome.storage.local.set({
      pendingTransaction: {
        ...transactionData,
        requestTime: Date.now(),
        sender: sender.url
      }
    });
    
    // Open popup to handle transaction
    await chrome.action.openPopup();
    
    return { success: true, message: 'Transaction request sent to popup' };
  } catch (error) {
    console.error('Failed to handle wallet transaction:', error);
    throw error;
  }
}

async function getWalletInfo() {
  try {
    const result = await chrome.storage.local.get(['authData', 'lastAuth']);
    
    return {
      isAuthenticated: !!result.authData,
      lastAuth: result.lastAuth,
      extensionVersion: chrome.runtime.getManifest().version
    };
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    return { error: error.message };
  }
}

async function cleanupOldData() {
  try {
    const result = await chrome.storage.local.get();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Clean up old pending transactions
    if (result.pendingTransaction && 
        now - result.pendingTransaction.requestTime > oneDay) {
      await chrome.storage.local.remove(['pendingTransaction']);
    }
    
    // Clean up old auth data if too old
    if (result.lastAuth && now - result.lastAuth > 7 * oneDay) {
      await chrome.storage.local.remove(['authData', 'lastAuth']);
    }
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection in background script:', error);
});

console.log('Guardian Vault background script loaded successfully');

// Export for content script communication
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    openWebApp,
    getCurrentTabInfo,
    isGuardianVaultCompatible
  };
}

