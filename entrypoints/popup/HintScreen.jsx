import { useState, useEffect } from "react";
import { toast } from "sonner"; // ← Add this import
import {
  Loader2,
  Sparkles,
  Brain,
  MessageSquare,
  Zap,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const HintScreen = ({
  onGetHint,
  hint,
  loading,
  userPrompt,
  setUserPrompt,
  apiKey,
  setApiKey,
  saveKey,
  hintType,
  setHintType,
}) => {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [liveHintsEnabled, setLiveHintsEnabled] = useState(false);

  // Load live hints preference
  useEffect(() => {
    chrome.storage.local.get(["LIVE_HINTS_ENABLED"], (result) => {
      setLiveHintsEnabled(result.LIVE_HINTS_ENABLED || false);
    });
  }, []);

  const toggleLiveHints = () => {
    const newState = !liveHintsEnabled;
    setLiveHintsEnabled(newState);

    // Save to storage
    chrome.storage.local.set({ LIVE_HINTS_ENABLED: newState });

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TOGGLE_LIVE_HINTS",
        enabled: newState,
      });
    });
  };

  const handleClick = () => {
    onGetHint();
  };

  const handleApiKeySave = () => {
    if (apiKey.trim() === "") {
      return toast.error("API key cannot be empty!");
    }
    saveKey();
    setShowApiKeyInput(false);
  };

  return (
    <div className="w-full max-w-sm bg-gray-900 text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-700">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">CodeMate</h2>
            <p className="text-xs text-gray-400">AI pair programmer</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Live Hints Toggle */}
        <div className="space-y-2 border border-gray-800 p-3 rounded-md bg-gray-800">
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={toggleLiveHints}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">
                Live Hints
              </span>
            </div>
            {liveHintsEnabled ? (
              <ToggleRight className="w-5 h-5 text-green-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {liveHintsEnabled
              ? "Real-time hints as you code (3s delay)"
              : "Click to enable automatic hints while typing"}
          </p>
        </div>

        {/* Hint Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Hint Category
          </label>
          <select
            value={hintType}
            onChange={(e) => setHintType(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="stepwise">Stepwise Approach</option>
            <option value="keypoints">Key Points & Pitfalls</option>
            <option value="why">Why This Recommendation</option>
            <option value="takeaways">Post-Submit Takeaways</option>
            <option value="live">Live Hints</option>
            <option value="stuck">Focused "I'm Stuck"</option>
          </select>
        </div>

        {/* Prompt input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-800" />
            <label className="text-sm font-medium text-gray-300">
              Your Prompt
            </label>
          </div>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none"
            placeholder="Describe what kind of hint you need..."
          />
        </div>

        {/* API Key Toggle */}
        <div className="space-y-2 border border-gray-800 p-3 rounded-md bg-gray-800">
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => setShowApiKeyInput((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">
                Change API Key
              </span>
            </div>
            {showApiKeyInput ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>

          {showApiKeyInput && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Gemini API key"
              />
              <button
                onClick={handleApiKeySave}
                className="w-full text-sm font-semibold py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition"
              >
                Save API Key
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full rounded-lg bg-blue-900 text-white py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Get Hint"
          )}
        </button>

        {/* Hint Display */}
        {!loading && hint && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-300">AI Response</span>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap">
                {hint}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HintScreen;
