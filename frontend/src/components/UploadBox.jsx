import { useState } from "react";
import axios from "axios";

export default function UploadBox() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      alert("Error uploading file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label className="block text-sm font-medium mb-2">Upload PDF or Image</label>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-900
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
      />

      <button
        onClick={handleUpload}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload & Analyze
      </button>

      {loading && <p className="mt-3">⏳ Processing...</p>}

      {result && (
        <div className="mt-5 p-4 bg-gray-50 rounded shadow">
          <h2 className="font-bold">Extracted Text</h2>
          <p className="whitespace-pre-wrap text-sm">{result.text}</p>

          <h2 className="font-bold mt-3">Suggestions</h2>
          <ul className="list-disc list-inside text-sm">
            {result.analysis?.suggestions?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
