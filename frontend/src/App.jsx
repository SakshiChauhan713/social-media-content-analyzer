import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
console.log("API Base from env:", import.meta.env.VITE_API_BASE);

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    chars: 0,
    words: 0,
    hashtags: 0,
    questions: 0,
    sentiment: "neutral",
  });

  const [dragActive, setDragActive] = useState(false);

  // 🌙 Dark mode state (saved in LocalStorage)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ✅ Load history from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetStates = () => {
    setText("");
    setSuggestions([]);
    setStats({
      chars: 0,
      words: 0,
      hashtags: 0,
      questions: 0,
      sentiment: "neutral",
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    resetStates();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      resetStates();
    }
  };

  const handleDownloadOriginal = () => {
    if (!file) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
  };

  const handleDownloadText = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (file?.name || "extracted") + ".txt";
    link.click();
  };

  const handleUpload = async () => {
    if (!file) return showToast("⚠ Please select a file first!", "warning");
    setLoading(true);
    resetStates();

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/extract`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Extract failed (${res.status})`);

      const data = await res.json();
      setText(data.text || "");
      if (data.warning) showToast(data.warning, "warning");

      const res2 = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text || "" }),
      });
      if (!res2.ok) throw new Error(`Analyze failed (${res2.status})`);

      const analysis = await res2.json();
      setSuggestions(analysis.suggestions || []);

      const words = (data.text || "").trim().split(/\s+/).filter(Boolean);
      const hashtags = (data.text.match(/#/g) || []).length;
      const questions = (data.text.match(/\?/g) || []).length;
      const sentiment =
        analysis.sentiment?.compound > 0.05
          ? "positive"
          : analysis.sentiment?.compound < -0.05
          ? "negative"
          : "neutral";

      const newStats = {
        chars: data.text?.length || 0,
        words: words.length,
        hashtags,
        questions,
        sentiment,
      };
      setStats(newStats);
      setHistory((prev) => [...prev, { filename: file.name, ...newStats }]);

      showToast("✅ Analysis complete!", "info");
    } catch (err) {
      console.error(err);
      showToast("❌ Something went wrong! " + err.message, "error");
    }
    setLoading(false);
  };

  return (
    <div
      className={`min-h-screen p-6 transition-colors ${
        darkMode
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-r from-white via-pink-50 to-purple-50 text-gray-900"
      }`}
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow text-sm ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "warning"
              ? "bg-yellow-400 text-black"
              : "bg-black text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
          📑 Social Media Content Analyzer
        </h1>

        {/* 🌙 Dark Mode Toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-full text-sm font-medium 
                       bg-gray-200 hover:bg-gray-300 
                       dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            {darkMode ? " DARK MODE" : "  LIGHT Mode"}
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div
            className={`rounded-2xl shadow-xl p-6 transition-colors ${
              darkMode ? "bg-gray-800" : "bg-white/90"
            }`}
          >
            <div
              className={`flex flex-col items-center gap-4 mb-6 w-full border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? darkMode
                    ? "border-purple-400 bg-gray-700"
                    : "border-purple-500 bg-purple-50"
                  : darkMode
                  ? "border-gray-600 bg-gray-900"
                  : "border-pink-200 bg-white"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.bmp"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer text-center text-gray-600 dark:text-gray-300"
              >
                <p className="text-lg">📂 Drag & Drop your file here</p>
                <p className="text-sm">or click to browse</p>
              </label>

              {file && (
                <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}

              <div className="flex gap-3 mt-3 flex-wrap justify-center">
                {/* Upload Button with spinner */}
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="px-6 py-2 rounded-full font-semibold 
                             bg-gradient-to-r from-purple-500 to-pink-500 
                             text-white shadow 
                             hover:from-purple-600 hover:to-pink-600 
                             disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "🚀 Upload & Analyze"
                  )}
                </button>

                <button
                  onClick={handleDownloadOriginal}
                  disabled={!file}
                  className="px-4 py-2 rounded-full border text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-gray-600 dark:text-purple-300 dark:hover:bg-gray-700"
                >
                  📂 Download Original
                </button>

                <button
                  onClick={handleDownloadText}
                  disabled={!text}
                  className="px-4 py-2 rounded-full border text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-gray-600 dark:text-purple-300 dark:hover:bg-gray-700"
                >
                  📝 Download Extracted Text
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div
            className={`rounded-2xl shadow-xl p-6 transition-colors ${
              darkMode ? "bg-gray-800" : "bg-white/90"
            }`}
          >
            {/* Stats */}
           <div className="flex flex-wrap gap-3 justify-center mb-6">
  <span
    className={`px-3 py-1 rounded-full text-sm 
                ${darkMode 
                  ? "bg-gray-700 text-white" 
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow"}`
    }
  >
    🔡 Chars: {stats.chars}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-sm 
                ${darkMode 
                  ? "bg-gray-700 text-white" 
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow"}`
    }
  >
    📖 Words: {stats.words}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-sm 
                ${darkMode 
                  ? "bg-gray-700 text-white" 
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow"}`
    }
  >
    #️⃣ Tags: {stats.hashtags}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-sm 
                ${darkMode 
                  ? "bg-gray-700 text-white" 
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow"}`
    }
  >
    ❓ Questions: {stats.questions}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-sm 
                ${darkMode 
                  ? "bg-gray-700 text-white" 
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow"}`
    }
  >
    😀 Sentiment: {stats.sentiment}
  </span>
</div>


            {/* Extracted Text */}
            {text && (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
      📝 Extracted Text
    </h2>
    <textarea
      className="w-full h-48 p-3 border rounded-lg 
                 bg-white text-gray-800 
                 dark:bg-gray-900 dark:text-gray-100 
                 font-mono text-sm"
      value={text}
      readOnly
    />
  </div>
)}

            {/* Suggestions */}
            {suggestions.length > 0 && (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
      💡 Suggestions
    </h2>
    <ul className="list-disc pl-6 space-y-1 text-gray-800 dark:text-gray-300">
      {suggestions.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <span>✨</span> {s}
        </li>
      ))}
    </ul>
  </div>
)}

            {/* History with Clear */}
            {history.length > 0 && (
  <div className="rounded-lg p-4 shadow-inner 
                  bg-pink-50 text-gray-800 
                  dark:bg-gray-900 dark:text-gray-100">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">📂 History</h2>
      <button
        onClick={() => {
          setHistory([]);
          localStorage.removeItem("history");
        }}
        className="text-red-500 text-sm hover:underline"
      >
        🗑 Clear
      </button>
    </div>
    <ul className="space-y-2 text-sm">
      {history.map((h, i) => (
        <li
          key={i}
          className="p-2 border rounded flex justify-between 
                     bg-purple-50 text-gray-800 
                     dark:bg-gray-800 dark:text-gray-200"
        >
          <span className="font-medium">{h.filename}</span>
          <span className="text-gray-500 dark:text-gray-400">
            {h.words} words • {h.hashtags} tags • {h.sentiment}
          </span>
        </li>
      ))}
    </ul>
  </div>
)}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
              Made with ❤️ using <span className="font-medium">FastAPI</span> +{" "}
              <span className="font-medium">React</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
