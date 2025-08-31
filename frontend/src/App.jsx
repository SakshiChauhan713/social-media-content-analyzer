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
  const [wordFreq, setWordFreq] = useState([]); // ✅ word cloud

  // 🌙 Dark mode
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

  // ✅ Load + Save history
  useEffect(() => {
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // ✅ Calculate Word Frequency when text changes
  useEffect(() => {
    if (!text) {
      setWordFreq([]);
      return;
    }

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9#? ]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const freq = {};
    words.forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // top 20 words

    setWordFreq(sorted);
  }, [text]);

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

  // 📋 Copy Extracted Text
  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("📋 Text copied!", "info");
  };

  // ⬇ Download Report
  const handleDownloadReport = () => {
    const report = {
      filename: file?.name || "unknown",
      stats,
      sentiment: stats.sentiment,
      suggestions,
      extractedText: text,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (file?.name || "report") + "_report.json";
    link.click();
  };

  // 🧹 Clear All
  const handleClearAll = () => {
    setFile(null);
    setText("");
    setSuggestions([]);
    setStats({
      chars: 0,
      words: 0,
      hashtags: 0,
      questions: 0,
      sentiment: "neutral",
    });
    setHistory([]);
    setWordFreq([]);
    localStorage.removeItem("history");
    showToast("🧹 All cleared!", "info");
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
            {darkMode ? " DARK MODE" : " LIGHT MODE"}
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          {/* ... (same as before - skipped for brevity) */}

          {/* Results Section */}
          <div
            className={`rounded-2xl shadow-xl p-6 transition-colors ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Stats */}
            {/* ... (same stats code as before) */}

            {/* Extracted Text */}
            {/* ... (same textarea + Copy + Report code) */}

            {/* Suggestions */}
            {/* ... (same suggestions code) */}

            {/* ✅ Word Cloud */}
            {wordFreq.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  ☁️ Word Cloud
                </h2>
                <div className="flex flex-wrap gap-2 bg-pink-50 dark:bg-gray-900 p-4 rounded-lg">
                  {wordFreq.map(([word, count], i) => (
                    <span
                      key={i}
                      className={`font-bold rounded px-2 py-1 ${
                        darkMode
                          ? "bg-gray-700 text-purple-200"
                          : "bg-purple-100 text-purple-800"
                      }`}
                      style={{
                        fontSize: `${12 + count * 2}px`,
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {/* ... (same history code as before) */}

            {/* Footer */}
            {/* ... (same footer code) */}
          </div>
        </div>
      </div>
    </div>
  );
}


