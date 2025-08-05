export default defineContentScript({
  matches: ["*://leetcode.com/problems/*"],
  main() {
    console.log("✅ CodeMate content script injected on LeetCode");
    console.log("📍 Current URL:", window.location.href);
    // Enhanced live hints tracking
    let isLiveHintsEnabled = false;
    let lastCodeLength = 0;
    let previousCode = "";
    let hintHistory = [];
    let progressStage = "started"; // started, progress, stuck, wrong_direction
    let inactivityTimer;
    let codeAnalysisTimer;
    let lastHintTime = 0;
    // Handle GET_LEETCODE_CODE messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Content script received message:", message.type, message);

      if (message.type === "GET_LEETCODE_CODE") {
        console.log("🔄 Starting to scrape LeetCode page...");

        try {
          // Get the code with multiple fallback strategies
          let code = "";

          // Strategy 1: Monaco Editor (most common)
          const monacoEditor = document.querySelector(".monaco-editor");
          console.log("🔍 Monaco editor found:", !!monacoEditor);

          if (monacoEditor) {
            const codeLines = monacoEditor.querySelectorAll(".view-lines > div");
            console.log("🔍 Code lines found:", codeLines.length);

            if (codeLines.length > 0) {
              code = Array.from(codeLines)
                .map((line) => line.innerText)
                .join("\n");
              console.log("✅ Code extracted from Monaco editor, length:", code.length);
            }
          }

          // Strategy 2: CodeMirror fallback
          if (!code.trim()) {
            const codeMirror = document.querySelector(".CodeMirror-code");
            console.log("🔍 CodeMirror found:", !!codeMirror);
            if (codeMirror) {
              const lines = codeMirror.querySelectorAll(".CodeMirror-line");
              code = Array.from(lines)
                .map((line) => line.textContent)
                .join("\n");
              console.log("✅ Code extracted from CodeMirror");
            }
          }

          // Strategy 3: Textarea fallback
          if (!code.trim()) {
            const textarea = document.querySelector('textarea[data-mode]');
            console.log("🔍 Data-mode textarea found:", !!textarea);
            if (textarea) {
              code = textarea.value;
              console.log("✅ Code extracted from textarea");
            }
          }

          // Strategy 4: Any textarea
          if (!code.trim()) {
            const anyTextarea = document.querySelector('textarea');
            console.log("🔍 Any textarea found:", !!anyTextarea);
            if (anyTextarea && anyTextarea.value.length > 10) {
              code = anyTextarea.value;
              console.log("✅ Code extracted from generic textarea");
            }
          }

          if (!code.trim()) {
            console.log("❌ No code found in any editor");
            sendResponse({ error: "No code found in editor" });
            return;
          }

          // Get title and description (same logic as before)
          let title = "";
          const titleElement1 = document.querySelector('a[href^="/problems/"].no-underline');
          if (titleElement1) {
            title = titleElement1.innerText.trim();
          }

          if (!title) {
            const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
            if (pathMatch) {
              title = pathMatch[1].replace(/-/g, ' ');
            }
          }

          let description = "Problem description";

          console.log("📊 Final scraped data:", {
            codeLength: code.length,
            titleLength: title.length,
            descriptionLength: description.length
          });

          console.log("📤 Sending response back to popup");
          sendResponse({
            code: code || "// No code found",
            title: title || "Unknown Problem",
            description: description || "No description available."
          });
          sendResponse({
            code: code || "// No code found",
            title: title || "Unknown Problem",
            description: description || "No description available.",
            previousHints: hintHistory,
            progressStage: progressStage

          });

        } catch (err) {
          console.error("❌ Failed to scrape LeetCode content:", err);
          sendResponse({ error: `Failed to scrape page data: ${err.message}` });
        }
        return true; // Allow async response
      }
      // Handle LIVE_HINT message
      if (message.type === "TOGGLE_LIVE_HINTS") {
        isLiveHintsEnabled = message.enabled;
        chrome.storage.local.set({ LIVE_HINTS_ENABLED: isLiveHintsEnabled });
        if (isLiveHintsEnabled) {
          initalizeSmartCodeMonitoring();
        } else {
          cleanup();
        }
      }
    });
    chrome.storage.local.get(["LIVE_HINTS_ENABLED"], (result) => {
      isLiveHintsEnabled = result.LIVE_HINTS_ENABLED || false;
      if (isLiveHintsEnabled) {
        initializeSmartCodeMonitoring(); // Fix this typo (was "initalizeSmartCodeMonitoring")
      }
    });
    function initializeSmartCodeMonitoring() { // Make sure function name matches
      const editorRoot = document.querySelector(".monaco-editor .view-lines");
      if (!editorRoot) {
        setTimeout(initializeSmartCodeMonitoring, 2000);
        return;
      }
      console.log("🧠 Initializing smart live code monitoring...");

      console.log("🎯 Content script setup complete, ready to receive messages");
      const obs = new MutationObserver(() => {
        clearTimeout(inactivityTimer);

        // Get current code
        const currentCode = Array.from(
          document.querySelectorAll(".monaco-editor .view-lines > div")
        ).map((line) => line.innerText).join("\n");

        // Analyze code changes
        const codeProgress = analyzeCodeProgress(currentCode, previousCode);

        if (codeProgress.shouldTriggerHint) {
          inactivityTimer = setTimeout(() => {
            if (currentCode.trim().length > 20) {
              // Avoid hint spam - minimum 30 seconds between live hints
              const now = Date.now();
              if (now - lastHintTime > 30000) {
                console.log("🚀 Triggering smart live hint...");
                chrome.runtime.sendMessage({
                  type: "CODE_UPDATED",
                  code: currentCode,
                  progressStage: codeProgress.stage,
                  changeType: codeProgress.changeType
                });
                lastHintTime = now;
              }
            }
          }, 3000);
        }

        previousCode = currentCode;
        lastCodeLength = currentCode.length;
      });
      obs.observe(editorRoot, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      window.codeObserver = obs;
    }

    function analyzeCodeProgress(currentCode, previousCode) {
      const currentLength = currentCode.trim().length;
      const previousLength = previousCode.trim().length;
      const lengthDiff = currentLength - previousLength;

      let stage = "progress";
      let changeType = "typing";
      let shouldTriggerHint = false;
      if (previousLength < 50 && currentLength > 50) {
        stage = "started";
        changeType = "initial_code";
        shouldTriggerHint = true;
      }
      else if (lengthDiff > 50) {
        stage = "progress";
        changeType = "major_addition";
        shouldTriggerHint = true;
      }
      else if (lengthDiff < -30 && currentLength > 20) {
        stage = "stuck";
        changeType = "major_deletion";
        shouldTriggerHint = true;
      }
      else if (detectWrongDirection(currentCode, previousCode)) {
        stage = "wrong_direction";
        changeType = "potentially_wrong";
        shouldTriggerHint = true;
      }
      else if (Math.abs(lengthDiff) > 15) {
        stage = "progress";
        changeType = "moderate_change";
        shouldTriggerHint = true;
      }
      progressStage = stage;
      return { stage, changeType, shouldTriggerHint };
    }
    function detectWrongDirection(currentCode, previousCode) {
      // Simple heuristics for wrong direction
      const wrongPatterns = [
        /for.*for.*for/i, // Triple nested loops (usually inefficient)
        /while.*true.*break/i, // Infinite loops with breaks
        /\.sort\(\).*\.sort\(\)/i, // Multiple sorts
      ];

      return wrongPatterns.some(pattern =>
        pattern.test(currentCode) && !pattern.test(previousCode)
      );
    }
    function cleanup() {
      if (window.codeObserver) {
        window.codeObserver.disconnect();
        window.codeObserver = null;
      }
      clearTimeout(inactivityTimer);
      hintHistory = [];
      progressStage = "started";
    }
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "LIVE_HINT_RECEIVED") {
        hintHistory.push(message.hint);
        // Keep only last 3 hints for context
        if (hintHistory.length > 3) {
          hintHistory.shift();
        }
      }
    });

    window.addEventListener('beforeunload', cleanup);
    console.log("🎯 Smart content script setup complete");

  },
});
