import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://Wititas-my-project-backend.hf.space';

const funFacts = [
    "เคล็ดลับ: ภาพที่มีแสงสว่างดีและเห็นใบหน้าชัดเจนให้ผลลัพธ์ที่ดีที่สุด",
    "รู้หรือไม่? โมเดล VGG-Face ถูกฝึกฝนด้วยภาพใบหน้ากว่า 2.6 ล้านภาพ",
    "การวิเคราะห์ฉากหลังช่วยให้รู้ว่าภาพถูกถ่ายในสถานที่เดียวกันหรือไม่",
    "โมเดล SFace เป็นหนึ่งในโมเดลวิเคราะห์ใบหน้าที่เร็วและทันสมัยที่สุด",
    "ระบบกำลังเปรียบเทียบคุณลักษณะหลายพันจุดบนใบหน้าและฉากหลัง",
];

const MasterSummaryTable = ({ results }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-center mb-6">ตารางสรุปเปรียบเทียบประสิทธิภาพโมเดล</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 font-semibold text-left">ชื่อโมเดล</th>
                        <th className="p-3 font-semibold text-left">โมเดลเสริม</th>
                        <th className="p-3 font-semibold">ประเภท</th>
                        <th className="p-3 font-semibold">จำนวนภาพ</th>
                        <th className="p-3 font-semibold">เวลาประมวลผล (วินาที)</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(results).map(([modelName, modelData]) => {
                        if (typeof modelData !== 'object' || !modelData) return null;
                        const isFaceModel = 'face_groups' in modelData;
                        const modelType = isFaceModel ? 'ใบหน้า' : 'ฉากหลัง';
                        const auxModel = isFaceModel ? 'retina (face detection)' : 'deeplab (background segmentation)';
                        return (
                            <tr key={modelName} className="border-t">
                                <td className="p-3 text-left font-semibold">{modelName}</td>
                                <td className="p-3 text-left text-gray-600">{auxModel}</td>
                                <td className="p-3 text-center">{modelType}</td>
                                <td className="p-3 text-center">{modelData.image_count}</td>
                                <td className="p-3 text-center">{modelData.processing_time.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);


const DetailedSummaryTable = ({ modelData }) => {
    const groups = modelData.face_groups || modelData.background_groups;
    const avgScores = modelData.avg_face_scores || modelData.avg_background_scores;
    if (!groups || !avgScores) return null;
    
    const leftoverNames = ["บุคคลที่ไม่ถูกจัดกลุ่ม", "สถานที่ที่ไม่ถูกจัดกลุ่ม"];
    let scoreCounter = 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-bold text-center mb-4">สรุปผลการจัดกลุ่ม</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">ประเภทกลุ่มหลัก</th>
                            <th className="p-2">กลุ่มที่</th>
                            <th className="p-2">จำนวนภาพ</th>
                            <th className="p-2 text-left">รายชื่อไฟล์</th>
                            <th className="p-2">เฉลี่ย Cosine</th>
                            <th className="p-2">เฉลี่ย Pearson</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groups).flatMap(([groupName, groupList]) =>
                            groupList.map((members, i) => {
                                const scoreKey = `${groupName}_${scoreCounter}`;
                                const scores = avgScores[scoreKey] || { cosine: 0, pearson: 0 };
                                scoreCounter++;
                                return (
                                    <tr key={scoreKey} className="border-t">
                                        <td className="p-2">{groupName}</td>
                                        <td className="p-2 text-center">{leftoverNames.includes(groupName) ? '-' : i + 1}</td>
                                        <td className="p-2 text-center">{members.length}</td>
                                        <td className="p-2 text-xs">{members.join(', ')}</td>
                                        <td className="p-2 text-center font-medium text-blue-600">{(scores.cosine * 100).toFixed(2)}%</td>
                                        <td className="p-2 text-center font-medium text-green-600">{(scores.pearson * 100).toFixed(2)}%</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function Processing() {
    const { jobId } = useParams();
    const location = useLocation();
    const mode = new URLSearchParams(location.search).get('mode');

    const [statusMessage, setStatusMessage] = useState('กำลังเริ่มต้น...');
    const [statusDetail, setStatusDetail] = useState('กรุณารอสักครู่...');
    const [funFact, setFunFact] = useState(funFacts[0]);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    
    const pollingRef = useRef(null);
    const factRef = useRef(null);

    const cleanUpIntervals = () => {
        clearInterval(pollingRef.current);
        clearInterval(factRef.current);
    };

    useEffect(() => {
        const startAnalysisIfNeeded = async () => {
            if (mode === 'comparison') {
                try {
                    await axios.post(`${API_URL}/start_analysis/${jobId}`, { mode: 'comparison' });
                } catch (err) {
                    setError('ไม่สามารถเริ่มการวิเคราะห์ได้');
                    cleanUpIntervals();
                }
            }
        };

        const pollStatus = async () => {
            try {
                const response = await axios.get(`${API_URL}/status/${jobId}`);
                const data = response.data;
                
                const message = data.message || '';
                const match = message.match(/(.*?)(\s\(.+?\))?$/);
                
                if (match) {
                    setStatusMessage(match[1] || 'กำลังประมวลผล...');
                    setStatusDetail((match[2] || '').trim());
                } else {
                    setStatusMessage(message);
                    setStatusDetail('');
                }

                if (data.status === 'completed') {
                    setResults(data.results);
                    if (data.results && Object.keys(data.results).length > 0) {
                        setActiveTab(Object.keys(data.results)[0]);
                    }
                    cleanUpIntervals();
                } else if (data.status === 'failed') {
                    setError(data.message);
                    cleanUpIntervals();
                }
            } catch (err) {
                setStatusMessage("การเชื่อมต่อขัดข้อง...");
                setStatusDetail("กำลังพยายามเชื่อมต่อใหม่");
            }
        };
        
        startAnalysisIfNeeded();
        pollingRef.current = setInterval(pollStatus, 2500);
        factRef.current = setInterval(() => {
            setFunFact(prev => funFacts[(funFacts.indexOf(prev) + 1) % funFacts.length]);
        }, 10000);

        return cleanUpIntervals;
    }, [jobId, mode]);

    if (error) return (
        <div className="max-w-7xl mx-auto p-8 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h1>
                <p className="text-gray-600 mt-2">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {!results ? (
                <>
                    <div className="bg-white p-8 rounded-xl shadow-lg text-center mb-8">
                        <div className="flex justify-center items-center mb-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">{statusMessage}</h1>
                        <p className="text-gray-500 mt-2 font-medium">{statusDetail}</p>
                    </div>
                    <p className="text-center text-gray-600 mt-8 px-4">{funFact}</p>
                </>
            ) : (
                <div id="results-area">
                    {Object.keys(results).length > 0 && <MasterSummaryTable results={results} />}
                    <div className="mb-4 flex flex-wrap border-b border-gray-200">
                        {Object.keys(results).map(modelName => (
                            <button 
                                key={modelName}
                                onClick={() => setActiveTab(modelName)}
                                className={`tab-button text-lg py-2 px-4 -mb-px border-b-2 font-medium border-transparent transition-colors duration-300 ${activeTab === modelName ? 'active' : ''}`}
                            >
                                {modelName}
                            </button>
                        ))}
                    </div>
                    {Object.entries(results).map(([modelName, modelData]) => (
                        <div key={modelName} style={{ display: activeTab === modelName ? 'block' : 'none' }}>
                            {modelData && <DetailedSummaryTable modelData={modelData} />}
                        </div>
                    ))}
                    <div className="text-center mt-12 space-x-4">
                        <a href={`${API_URL}/download_report/${jobId}`} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700">ดาวน์โหลด PDF</a>
                        <Link to="/" className="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600">วิเคราะห์ใหม่อีกครั้ง</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Processing;