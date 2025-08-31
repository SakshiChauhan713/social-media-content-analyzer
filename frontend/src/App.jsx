import { useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
console.log("API Base from env:", import.meta.env.VITE_API_BASE);

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    chars: 0,
    words: 0,
    hashtags: 0,
    questions: 0,
    sentiment: "neutral",
  });

  const [dragActive, setDragActive] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const resetStates = () => {
    setError("");
    setWarning("");
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
    if (!file) return showToast("⚠ Please select a file first!");
    setLoading(true);
    resetStates();

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/extract`, { method: "POST", body: form });
      const data = await res.json();
      setText(data.text || "");
      if (data.warning) setWarning(data.warning);

      const res2 = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text || "" }),
      });
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

      showToast("✅ Analysis complete!");
    } catch (err) {
      setError("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 p-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-black text-white text-sm px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
          📑 Social Media Content Analyzer
        </h1>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section (Left) */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div
              className={`flex flex-col items-center gap-4 mb-6 w-full border-2 border-dashed rounded-lg p-6 transition
              ${dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-white/50"}`}
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
              <label htmlFor="fileInput" className="cursor-pointer text-center text-gray-600">
                <p className="text-lg">📂 Drag & Drop your file here</p>
                <p className="text-sm">or click to browse</p>
              </label>

              {file && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}

              <div className="flex gap-3 mt-3 flex-wrap justify-center">
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="px-6 py-2 rounded-full font-semibold 
                             bg-gradient-to-r from-purple-500 to-pink-500 
                             text-white shadow 
                             hover:from-purple-600 hover:to-pink-600 
                             disabled:bg-gray-400"
                >
                  {loading ? "⏳ Processing..." : "🚀 Upload & Analyze"}
                </button>

                <button
                  onClick={handleDownloadOriginal}
                  disabled={!file}
                  className="px-4 py-2 rounded-full border text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  📂 Download Original
                </button>

                <button
                  onClick={handleDownloadText}
                  disabled={!text}
                  className="px-4 py-2 rounded-full border text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  📝 Download Extracted Text
                </button>
              </div>

              {error && <p className="text-red-500 text-sm mt-2">⚠ {error}</p>}
              {warning && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded text-sm mt-2">
                  ⚠ {warning}
                </p>
              )}
            </div>
          </div>

          {/* Results Section (Right) */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Stats */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">🔡 Chars: {stats.chars}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">📖 Words: {stats.words}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">#️⃣ Tags: {stats.hashtags}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">❓ Questions: {stats.questions}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">😀 Sentiment: {stats.sentiment}</span>
            </div>

            {/* Extracted Text */}
            {text && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">📝 Extracted Text</h2>
                <textarea
                  className="w-full h-48 p-3 border rounded-lg bg-gray-50 font-mono text-sm"
                  value={text}
                  readOnly
                />
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">💡 Suggestions</h2>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>✨</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white/70 rounded-lg p-4 shadow-inner">
                <h2 className="text-lg font-semibold mb-2">📂 History (this session)</h2>
                <ul className="space-y-2 text-sm">
                  {history.map((h, i) => (
                    <li key={i} className="p-2 border rounded flex justify-between">
                      <span className="font-medium">{h.filename}</span>
                      <span className="text-gray-500">
                        {h.words} words • {h.hashtags} tags • {h.sentiment}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-8">
              Made with ❤️ using <span className="font-medium">FastAPI</span> +{" "}
              <span className="font-medium">React</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


