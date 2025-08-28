import UploadBox from "./components/UploadBox";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-6">📊 Social Media Content Analyzer</h1>
        <UploadBox />
      </div>
    </div>
  );
}

export default App;

