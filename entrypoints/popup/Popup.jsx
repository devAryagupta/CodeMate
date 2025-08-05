import { useEffect, useState } from "react";
import ApiKeyScreen from "./ApiKeyScreen";
import HintScreen from "./HintScreen";
import { Toaster, toast } from "sonner";
import { getGeminiHint } from "./api";

const Popup = () => {
  const [apiKey, setApiKey] = useState("");
  const [showHintScreen, setShowHintScreen] = useState(false);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState(
    "Let help me to Understand how to approach this.Break it down into subproblems & Identify patterns (e.g. greedy, DP, sliding window, etc.What kind of input-output patterns should I be paying attention to?Are there known algorithmic paradigms that usually work for these kinds of constraints (e.g. “subarrays with sum,” “shortest path in matrix,” etc.)?"
  );
  const [hintType, setHintType] = useState("stepwise");

  const loadApiKeyFromStorage = () => {
    chrome.storage.local.get(["GEMINI_API_KEY"], (result) => {
      // console.log("[useEffect] Fetched key:", result.GEMINI_API_KEY);
      if (result.GEMINI_API_KEY) {
        setApiKey(result.GEMINI_API_KEY);
        setShowHintScreen(true);
      }
    });
  };

  useEffect(() => {
    loadApiKeyFromStorage();
  }, []);

  const saveKey = () => {
    chrome.storage.local.set({ GEMINI_API_KEY: apiKey }, () => {
      setShowHintScreen(true);
    });
  };

  const onGetHint = async () => {
    setLoading(true);
    setHint("Fetching code...");
    console.log("[onGetHint] Current apiKey before fetch:", apiKey);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_LEETCODE_CODE" },
        async (response) => {
          // console.log(response);
          if (!response || response.error) {
            toast.error("Failed to get code from page.");
            setHint("Could not get code.");
            setLoading(false);
            return;
          }
          // loadApiKeyFromStorage();
          // console.log(apiKey);
          const prompt =
            userPrompt ||
            "Let help me to Understand how to approach this.Break it down into subproblems & Identify patterns (e.g. greedy, DP, sliding window, etc.What kind of input-output patterns should I be paying attention to?Are there known algorithmic paradigms that usually work for these kinds of constraints (e.g. “subarrays with sum,” “shortest path in matrix,” etc.)?";
          const result = await getGeminiHint({
            code: response.code,
            prompt,
            title: response.title,
            description: response.description,
            apiKey,
            hintType,
          });

          setHint(result);
          setLoading(false);
        }
      );
    } catch (err) {
      // console.error("Hint generation failed:", err);
      toast.error("Something went wrong.");
      setHint("Error generating hint.");
      setLoading(false);
    }
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "LIVE_HINT") {
        setHint(message.hint);
        setLoading(false);
      }
    });
  }, []);

  return (
    <>
      <Toaster position="bottom-center" richColors />
      <div className="w-[360px] min-h-[400px] p-4 bg-white text-gray-900 dark:bg-[#1e1e1e] dark:text-gray-100 font-sans text-sm rounded-md shadow-md space-y-4 overflow-auto">
        {showHintScreen ? (
          <HintScreen
            apiKey={apiKey}
            hint={hint}
            loading={loading}
            onGetHint={onGetHint}
            userPrompt={userPrompt}
            setUserPrompt={setUserPrompt}
            hintType={hintType}
            setHintType={setHintType}
            setApiKey={setApiKey}
            saveKey={saveKey}
          />
        ) : (
          <ApiKeyScreen
            apiKey={apiKey}
            setApiKey={setApiKey}
            saveKey={saveKey}
          />
        )}
      </div>
    </>
  );
};

export default Popup;
