// Guardian Vault Content Script
// Injected into web pages to enable Guardian Vault integration

(function() {
  'use strict';
  
  console.log('Guardian Vault content script loaded');
  
  const GUARDIAN_VAULT_API = 'guardianVault';
  const MESSAGE_TYPES = {
    CONNECT_REQUEST: 'CONNECT_REQUEST',
    TRANSACTION_REQUEST: 'TRANSACTION_REQUEST',
    BALANCE_REQUEST: 'BALANCE_REQUEST',
    SIGN_REQUEST: 'SIGN_REQUEST',
  };
  
  // Create Guardian Vault API object
  const GuardianVaultAPI = {
    // Connection management
    async connect() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'REQUEST_CONNECTION'
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve({
              connected: response.connected,
              extensionId: response.extensionId,
              version: response.version
            });
          }
        });
      });
    },
    
    // Get wallet information
    async getWalletInfo() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'REQUEST_WALLET_INFO'
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    
    // Request ckBTC balance
    async getBalance() {
      return this.sendToExtension(MESSAGE_TYPES.BALANCE_REQUEST, {});
    },
    
    // Request transaction
    async sendTransaction(to, amount, memo = null) {
      return this.sendToExtension(MESSAGE_TYPES.TRANSACTION_REQUEST, {
        to,\n        amount,\n        memo\n      });\n    },\n    \n    // Sign arbitrary message\n    async signMessage(message) {\n      return this.sendToExtension(MESSAGE_TYPES.SIGN_REQUEST, {\n        message\n      });\n    },\n    \n    // Helper method to communicate with extension\n    async sendToExtension(type, data) {\n      return new Promise((resolve, reject) => {\n        const messageId = `gv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n        \n        chrome.runtime.sendMessage({\n          type: 'WALLET_TRANSACTION',\n          data: {\n            type,\n            data,\n            messageId,\n            origin: window.location.origin,\n            timestamp: Date.now()\n          }\n        }, (response) => {\n          if (chrome.runtime.lastError) {\n            reject(new Error(chrome.runtime.lastError.message));\n          } else if (response.error) {\n            reject(new Error(response.error));\n          } else {\n            resolve(response);\n          }\n        });\n      });\n    },\n    \n    // Event listeners for extension updates\n    addEventListener(eventType, callback) {\n      document.addEventListener(`guardianvault_${eventType}`, callback);\n    },\n    \n    removeEventListener(eventType, callback) {\n      document.removeEventListener(`guardianvault_${eventType}`, callback);\n    },\n    \n    // Version and info\n    version: '0.1.0',\n    name: 'Guardian Vault'\n  };\n  \n  // Inject API into page if not already present\n  if (!window[GUARDIAN_VAULT_API]) {\n    Object.defineProperty(window, GUARDIAN_VAULT_API, {\n      value: GuardianVaultAPI,\n      writable: false,\n      configurable: false\n    });\n    \n    // Dispatch custom event to notify page that Guardian Vault is available\n    const event = new CustomEvent('guardianvault_ready', {\n      detail: {\n        version: GuardianVaultAPI.version,\n        timestamp: Date.now()\n      }\n    });\n    document.dispatchEvent(event);\n    \n    console.log('Guardian Vault API injected into page');\n  }\n  \n  // Detect and enhance Guardian Vault-compatible elements\n  function enhanceGuardianVaultElements() {\n    // Find elements with data-guardian-vault attributes\n    const elements = document.querySelectorAll('[data-guardian-vault]');\n    \n    elements.forEach(element => {\n      const action = element.getAttribute('data-guardian-vault');\n      \n      switch (action) {\n        case 'connect':\n          enhanceConnectElement(element);\n          break;\n        case 'send':\n          enhanceSendElement(element);\n          break;\n        case 'balance':\n          enhanceBalanceElement(element);\n          break;\n        default:\n          console.warn('Unknown Guardian Vault action:', action);\n      }\n    });\n  }\n  \n  function enhanceConnectElement(element) {\n    if (element.hasAttribute('data-gv-enhanced')) return;\n    \n    element.addEventListener('click', async (event) => {\n      event.preventDefault();\n      \n      try {\n        element.textContent = 'Connecting...';\n        element.disabled = true;\n        \n        const connection = await GuardianVaultAPI.connect();\n        \n        element.textContent = 'Connected to Guardian Vault';\n        element.classList.add('gv-connected');\n        \n        // Dispatch success event\n        const successEvent = new CustomEvent('guardianvault_connected', {\n          detail: connection\n        });\n        element.dispatchEvent(successEvent);\n        \n      } catch (error) {\n        console.error('Guardian Vault connection failed:', error);\n        element.textContent = 'Connection Failed';\n        element.classList.add('gv-error');\n        \n        setTimeout(() => {\n          element.textContent = 'Connect Guardian Vault';\n          element.disabled = false;\n          element.classList.remove('gv-error');\n        }, 2000);\n      }\n    });\n    \n    element.setAttribute('data-gv-enhanced', 'true');\n  }\n  \n  function enhanceSendElement(element) {\n    if (element.hasAttribute('data-gv-enhanced')) return;\n    \n    element.addEventListener('click', async (event) => {\n      event.preventDefault();\n      \n      const to = element.getAttribute('data-gv-to');\n      const amount = element.getAttribute('data-gv-amount');\n      const memo = element.getAttribute('data-gv-memo');\n      \n      if (!to || !amount) {\n        console.error('Missing required attributes: data-gv-to, data-gv-amount');\n        return;\n      }\n      \n      try {\n        element.textContent = 'Processing...';\n        element.disabled = true;\n        \n        const result = await GuardianVaultAPI.sendTransaction(to, amount, memo);\n        \n        element.textContent = 'Transaction Sent';\n        element.classList.add('gv-success');\n        \n        // Dispatch success event\n        const successEvent = new CustomEvent('guardianvault_transaction_success', {\n          detail: result\n        });\n        element.dispatchEvent(successEvent);\n        \n      } catch (error) {\n        console.error('Guardian Vault transaction failed:', error);\n        element.textContent = 'Transaction Failed';\n        element.classList.add('gv-error');\n        \n        setTimeout(() => {\n          element.textContent = element.getAttribute('data-original-text') || 'Send with Guardian Vault';\n          element.disabled = false;\n          element.classList.remove('gv-error');\n        }, 2000);\n      }\n    });\n    \n    // Store original text\n    element.setAttribute('data-original-text', element.textContent);\n    element.setAttribute('data-gv-enhanced', 'true');\n  }\n  \n  function enhanceBalanceElement(element) {\n    if (element.hasAttribute('data-gv-enhanced')) return;\n    \n    const updateBalance = async () => {\n      try {\n        element.textContent = 'Loading...';\n        \n        const walletInfo = await GuardianVaultAPI.getWalletInfo();\n        \n        if (walletInfo.isAuthenticated) {\n          const balance = await GuardianVaultAPI.getBalance();\n          const formatted = (parseFloat(balance) / 100000000).toFixed(8);\n          element.textContent = `${formatted} ckBTC`;\n          element.classList.add('gv-loaded');\n        } else {\n          element.textContent = 'Not connected';\n          element.classList.add('gv-not-connected');\n        }\n        \n      } catch (error) {\n        console.error('Failed to load balance:', error);\n        element.textContent = 'Error loading balance';\n        element.classList.add('gv-error');\n      }\n    };\n    \n    // Initial load\n    updateBalance();\n    \n    // Add click to refresh\n    element.addEventListener('click', updateBalance);\n    element.style.cursor = 'pointer';\n    element.title = 'Click to refresh';\n    \n    element.setAttribute('data-gv-enhanced', 'true');\n  }\n  \n  // Auto-enhance elements on load and when DOM changes\n  function init() {\n    enhanceGuardianVaultElements();\n    \n    // Watch for dynamically added elements\n    const observer = new MutationObserver((mutations) => {\n      let shouldEnhance = false;\n      \n      mutations.forEach((mutation) => {\n        mutation.addedNodes.forEach((node) => {\n          if (node.nodeType === Node.ELEMENT_NODE) {\n            if (node.hasAttribute && node.hasAttribute('data-guardian-vault')) {\n              shouldEnhance = true;\n            } else if (node.querySelectorAll) {\n              const gvElements = node.querySelectorAll('[data-guardian-vault]');\n              if (gvElements.length > 0) {\n                shouldEnhance = true;\n              }\n            }\n          }\n        });\n      });\n      \n      if (shouldEnhance) {\n        enhanceGuardianVaultElements();\n      }\n    });\n    \n    observer.observe(document.body, {\n      childList: true,\n      subtree: true\n    });\n  }\n  \n  // Auto-detect common wallet interaction patterns\n  function autoDetectWalletElements() {\n    // Look for Principal IDs in the page\n    const principalRegex = /\\b[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}\\b/g;\n    const textNodes = [];\n    \n    function getTextNodes(node) {\n      if (node.nodeType === Node.TEXT_NODE) {\n        if (principalRegex.test(node.textContent)) {\n          textNodes.push(node);\n        }\n      } else {\n        for (let child of node.childNodes) {\n          getTextNodes(child);\n        }\n      }\n    }\n    \n    getTextNodes(document.body);\n    \n    // Add hover tooltips for detected Principal IDs\n    textNodes.forEach(node => {\n      const parent = node.parentElement;\n      if (parent && !parent.hasAttribute('data-gv-detected')) {\n        parent.style.position = 'relative';\n        parent.setAttribute('data-gv-detected', 'true');\n        parent.title = 'Guardian Vault detected a Principal ID - Click to interact';\n        \n        parent.addEventListener('click', () => {\n          const matches = node.textContent.match(principalRegex);\n          if (matches && matches.length > 0) {\n            const event = new CustomEvent('guardianvault_principal_clicked', {\n              detail: {\n                principal: matches[0],\n                element: parent\n              }\n            });\n            document.dispatchEvent(event);\n          }\n        });\n      }\n    });\n  }\n  \n  // Initialize when DOM is ready\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', init);\n  } else {\n    init();\n  }\n  \n  // Auto-detect after a short delay\n  setTimeout(autoDetectWalletElements, 1000);\n  \n  // Add basic CSS for Guardian Vault enhanced elements\n  const style = document.createElement('style');\n  style.textContent = `\n    .gv-connected {\n      background-color: #10B981 !important;\n      color: white !important;\n    }\n    \n    .gv-error {\n      background-color: #EF4444 !important;\n      color: white !important;\n    }\n    \n    .gv-success {\n      background-color: #10B981 !important;\n      color: white !important;\n    }\n    \n    .gv-not-connected {\n      background-color: #6B7280 !important;\n      color: white !important;\n    }\n    \n    .gv-loaded {\n      background-color: #29ABE2 !important;\n      color: white !important;\n      font-family: ui-monospace, monospace !important;\n    }\n    \n    [data-gv-detected]:hover {\n      background-color: rgba(41, 171, 226, 0.1) !important;\n      cursor: pointer !important;\n      border-radius: 4px !important;\n      padding: 2px 4px !important;\n    }\n  `;\n  document.head.appendChild(style);\n  \n  console.log('Guardian Vault content script initialized');\n  \n})();