import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function SelectModel() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [models, setModels] = useState({ face_models: [], bg_models: [] });
  const [selectedFaceModel, setSelectedFaceModel] = useState('');
  const [selectedBgModel, setSelectedBgModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${API_URL}/models`);
        setModels(response.data);
        if (response.data.face_models.length > 0) {
          setSelectedFaceModel(response.data.face_models[0]);
        }
        if (response.data.bg_models.length > 0) {
          setSelectedBgModel(response.data.bg_models[0]);
        }
      } catch (error) {
        console.error("Failed to fetch models", error);
        alert('ไม่สามารถโหลดรายการโมเดลได้');
      }
    };
    fetchModels();
  }, []);

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    try {
      const payload = {
        mode: 'quick_analysis',
        face_model: selectedFaceModel,
        bg_model: selectedBgModel,
      };
      await axios.post(`${API_URL}/start_analysis/${jobId}`, payload);
      navigate(`/processing/${jobId}?mode=quick_analysis`);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('ไม่สามารถเริ่มการวิเคราะห์ได้');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800">โหมดเจาะจง</h1>
        <p className="text-gray-500 mt-2">เลือกโมเดลที่ต้องการใช้ในการวิเคราะห์</p>

        <div className="mt-8 grid md:grid-cols-2 gap-8 text-left">
          <div>
            <label htmlFor="face_model" className="block text-sm font-medium text-gray-700 mb-2">โมเดลวิเคราะห์ใบหน้า</label>
            <select id="face_model" value={selectedFaceModel} onChange={(e) => setSelectedFaceModel(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {models.face_models.map(model => <option key={model} value={model}>{model}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bg_model" className="block text-sm font-medium text-gray-700 mb-2">โมเดลวิเคราะห์ฉากหลัง</label>
            <select id="bg_model" value={selectedBgModel} onChange={(e) => setSelectedBgModel(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {models.bg_models.map(model => <option key={model} value={model}>{model}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={handleStartAnalysis} disabled={isLoading} className="w-full md:w-1/2 bg-blue-600 text-white font-bold py-4 px-12 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {isLoading ? 'กำลังเริ่มต้น...' : 'เริ่มการวิเคราะห์'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectModel;