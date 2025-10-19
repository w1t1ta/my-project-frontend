import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function ImageUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mode, setMode] = useState('');
  const [previews, setPreviews] = useState([]);
  const navigate = useNavigate();

  const updateFileListAndPreviews = (files) => {
    setSelectedFiles(files);
    previews.forEach(url => URL.revokeObjectURL(url));
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const updatedFiles = [...selectedFiles];
    const existingFilenames = new Set(selectedFiles.map(f => f.name));
    newFiles.forEach(file => {
      if (!existingFilenames.has(file.name)) {
        updatedFiles.push(file);
      }
    });
    updateFileListAndPreviews(updatedFiles);
  };
  
  const removeFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    updateFileListAndPreviews(updatedFiles);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mode) {
      alert('กรุณาเลือกโหมดการทำงาน');
      return;
    }
    
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('images', file));
    formData.append('mode', mode);

    try {
      const response = await axios.post(`${API_URL}/submit_images`, formData);
      
      // --- ❗️ จุดที่แก้ไข ---
      // รับค่า job_id จาก backend แล้วแปลงเป็นตัวแปรชื่อ jobId (camelCase)
      const { job_id: jobId, mode: responseMode } = response.data;

      if (!jobId) {
        throw new Error("ไม่ได้รับ Job ID จากเซิร์ฟเวอร์");
      }

      if (responseMode === 'quick_analysis') {
        navigate(`/select-model/${jobId}`);
      } else {
        navigate(`/processing/${jobId}?mode=comparison`);
      }
    } catch (error) {
      console.error('Upload Error:', error.response ? error.response.data : error.message);
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    }
  };
  
  const fileCount = selectedFiles.length;
  const isSubmitDisabled = fileCount < 2 || fileCount > 100 || !mode;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="flex justify-center">
          <img src="/cover.png" alt="Cover" className="h-24" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mt-4">กรุณาอัปโหลดรูปภาพ</h1>
        <p className="text-gray-500 mt-2">เพื่อเปรียบเทียบประสิทธิภาพโมเดล (อย่างน้อย 2 ถึง 100 ภาพ)</p>

        <form onSubmit={handleSubmit}>
          <div className="mt-8">
            <label htmlFor="image-input" className="bg-white border-2 border-dashed border-gray-400 text-gray-600 font-bold py-12 px-6 rounded-lg hover:border-blue-500 hover:text-blue-500 cursor-pointer transition block w-full">
              คลิกเพื่ออัปโหลดรูปภาพ
            </label>
            <input id="image-input" type="file" className="sr-only" accept="image/png, image/jpeg" multiple onChange={handleFileChange} />
            <p className={`mt-4 ${fileCount > 0 && (fileCount < 2 || fileCount > 100) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {fileCount === 0 ? 'ยังไม่ได้เลือกไฟล์' : fileCount < 2 || fileCount > 100 ? `ต้องเลือก 2 - 100 ภาพ! (คุณเลือก ${fileCount} ภาพ)` : `เลือกแล้ว ${fileCount} ภาพ`}
            </p>
            <p className="text-xs text-gray-400 mt-2">รองรับไฟล์ JPG, PNG</p>
          </div>

          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {previews.map((src, index) => (
              <div key={index} className="relative group">
                <img src={src} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md shadow-md" />
                <button type="button" onClick={() => removeFile(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition">&times;</button>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex justify-center space-x-4 mb-4">
              <button type="button" onClick={() => setMode('comparison')} className={`${mode === 'comparison' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} font-bold py-2 px-6 rounded-lg transition`}>
                โหมดเปรียบเทียบ (ทุกโมเดล)
              </button>
              <button type="button" onClick={() => setMode('quick_analysis')} className={`${mode === 'quick_analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} font-bold py-2 px-6 rounded-lg transition`}>
                โหมดเจาะจง (เลือกโมเดล)
              </button>
            </div>
            <button type="submit" disabled={isSubmitDisabled} className="w-full md:w-1/2 bg-green-600 text-white font-bold py-4 px-12 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              เริ่มการวิเคราะห์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImageUpload;