import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ImageUpload from './components/ImageUpload';
import SelectModel from './components/SelectModel';
import Processing from './components/Processing';

function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen font-sans">
        <nav className="bg-white text-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="font-bold text-xl">FaceBack SimSnap</Link>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<ImageUpload />} />
            <Route path="/select-model/:jobId" element={<SelectModel />} />
            <Route path="/processing/:jobId" element={<Processing />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;