import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Subscriber, AnalysisResult, AgentConfig, AiOverviewInsight, User } from '../types';
import FileUploader from './FileUploader';
import { getOverviewAiInsights } from '../services/geminiService';
import SummaryCards from './SummaryCards';
import AgentCharts from './AgentCharts';
import AiInsights from './AiInsights';
import AgentManagement from './AgentManagement';
import Sidebar from './Sidebar';
import AgentDetailView from './AgentDetailView';
import AgentsMapView from './AgentsMapView';

// This is a global declaration for the XLSX library loaded from CDN
declare const XLSX: any;

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const initialAgentConfigs: AgentConfig[] = [
    { id: '1', name: 'وكيل بغداد المركزي', zones: ['الكرادة', 'المنصور', 'زيونة'], latitude: 33.3152, longitude: 44.3661 },
    { id: '2', name: 'وكيل البصرة', zones: ['العشار', 'الجنينة'], latitude: 30.5156, longitude: 47.7788 },
];


const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiInsights, setAiInsights] = useState<AiOverviewInsight | string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(() => {
    try {
      const storedAgents = localStorage.getItem('agentConfigs');
      if (storedAgents) {
        return JSON.parse(storedAgents);
      }
    } catch (e) {
      console.error("Failed to load agent configs from localStorage", e);
    }
    return initialAgentConfigs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('agentConfigs', JSON.stringify(agentConfigs));
    } catch (e) {
      console.error("Failed to save agent configs to localStorage", e);
    }
  }, [agentConfigs]);


  const [currentView, setCurrentView] = useState<string>(() => {
    return user.role === 'admin' ? 'management' : 'uploader';
  });


  const processData = useCallback((data: any[]): AnalysisResult => {
    if (agentConfigs.length === 0) {
      throw new Error("لا يوجد وكلاء معرفون. الرجاء إضافة وكيل ومناطقه من خلال 'إدارة الوكلاء' أولاً قبل رفع الملف.");
    }
    const validAgentNames = new Set<string>(agentConfigs.map(config => config.name));
    
    const byAgent: { [key: string]: { subscribers: Subscriber[] } } = {};
    const subscribers: Subscriber[] = [];
    const fileAgentNames = new Set<string>();
    
    let ignoredUnregisteredAgent = 0;
    let ignoredInvalidData = 0;

    const expectedHeaders = ['ZoneContractor', 'UserFullName', 'PhoneNumber', 'userStatus', 'ZoneName', 'planStartDate'];
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const headerMap: { [key: string]: string } = {
        'ZoneContractor': 'اسم الوكيل (ZoneContractor)', 'UserFullName': 'اسم المشترك (UserFullName)',
        'PhoneNumber': 'رقم الهاتف (PhoneNumber)', 'userStatus': 'حالة المستخدم (userStatus)',
        'ZoneName': 'اسم الزون (ZoneName)', 'planStartDate': 'تاريخ بدء الخطة (planStartDate)',
      };
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h)).map(h => headerMap[h] || h);
      if (missingHeaders.length > 0) {
          throw new Error(`أعمدة مفقودة في ملف الإكسل: ${missingHeaders.join(', ')}. الرجاء التأكد من أن الملف يحتوي على الأعمدة المطلوبة.`);
      }
    } else {
        throw new Error("ملف الإكسل فارغ.");
    }

    for (const row of data) {
      const agentName = row['ZoneContractor']?.trim();

      if (agentName) fileAgentNames.add(agentName);
      
      if (!validAgentNames.has(agentName)) {
        if(agentName) ignoredUnregisteredAgent++;
        continue;
      }

      const inactiveStatuses = ['Deleted', 'Churn', 'Inactive'];
      const userStatusString = String(row['userStatus'] || '').trim();
      const status = inactiveStatuses.includes(userStatusString) ? 'غير فعال' : 'فعال';
      
      const expirationDateValue = row['تاريخ الانتهاء'] || row['planEndDate'];
      const planNameValue = row['اسم الباقة'] || row['planName'];

      const subscriber: Subscriber = {
        agentName: row['ZoneContractor'], customerName: row['UserFullName'],
        phoneNumber: String(row['PhoneNumber']), status: status, zone: row['ZoneName'],
        subscriptionDate: row['planStartDate'],
        expirationDate: expirationDateValue instanceof Date ? expirationDateValue : undefined,
        planName: planNameValue ? String(planNameValue).trim() : undefined,
      };
      
      if (!subscriber.agentName || !(subscriber.subscriptionDate instanceof Date)) {
        ignoredInvalidData++;
        continue;
      }
      
      if (!byAgent[subscriber.agentName]) {
        byAgent[subscriber.agentName] = { subscribers: [] };
      }
      byAgent[subscriber.agentName].subscribers.push(subscriber);
      subscribers.push(subscriber);
    }

    if (subscribers.length === 0) {
        const unmatchedAgents = Array.from(fileAgentNames).filter(name => !validAgentNames.has(name));
        if (unmatchedAgents.length > 0) {
            throw new Error(`لم يتم العثور على مشتركين مطابقين. الوكلاء التاليون موجودون في ملفك ولكنهم غير مسجلين في 'إدارة الوكلاء': ${unmatchedAgents.join(', ')}. يرجى إضافتهم أو التأكد من تطابق الأسماء.`);
        }
        throw new Error("لم يتم العثور على مشتركين مطابقين للوكلاء المحددين في 'إدارة الوكلاء'. يرجى التأكد من تطابق أسماء الوكلاء في الملف مع الإعدادات.");
    }
    
    const agentAnalysis: { [key: string]: any } = {};
    let totalActive = 0;
    let totalInactive = 0;
    
    Object.keys(byAgent).forEach(agentName => {
        const agentSubscribers = byAgent[agentName].subscribers;
        const active = agentSubscribers.filter(s => s.status === 'فعال').length;
        const inactive = agentSubscribers.length - active;
        totalActive += active;
        totalInactive += inactive;

        const zoneDistribution: { [key: string]: number } = {};
        agentSubscribers.forEach(s => {
            zoneDistribution[s.zone] = (zoneDistribution[s.zone] || 0) + 1;
        });

        agentAnalysis[agentName] = {
            stats: { total: agentSubscribers.length, active, inactive, zoneDistribution },
            subscribers: agentSubscribers,
        };
    });

    const timelineData = subscribers
      .filter(s => s.subscriptionDate instanceof Date && !isNaN(s.subscriptionDate.getTime()))
      .sort((a, b) => a.subscriptionDate.getTime() - b.subscriptionDate.getTime())
      .reduce((acc, subscriber) => {
        const dateStr = subscriber.subscriptionDate.toISOString().split('T')[0];
        const existing = acc.find(item => item.date === dateStr);
        if (existing) existing.count++;
        else acc.push({ date: dateStr, count: 1 });
        return acc;
      }, [] as { date: string; count: number }[]);
    
    const planDistribution: { [key: string]: number } = {};
    subscribers.forEach(s => {
        if (s.planName) {
            planDistribution[s.planName.trim()] = (planDistribution[s.planName.trim()] || 0) + 1;
        }
    });

    return {
      totalSubscribers: subscribers.length, totalAgents: Object.keys(byAgent).length,
      totalActive, totalInactive, byAgent: agentAnalysis,
      timeline: timelineData, planDistribution,
      ignoredRows: {
          unregisteredAgent: ignoredUnregisteredAgent, invalidData: ignoredInvalidData,
          total: ignoredUnregisteredAgent + ignoredInvalidData,
      }
    };
  }, [agentConfigs]);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true); setError(null); setAnalysis(null); setAiInsights(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const result = processData(json);
        setAnalysis(result);
        console.log(`File '${file.name}' was uploaded and processed.`);
        setCurrentView('overview');

        setIsAiLoading(true);
        const insightsText = await getOverviewAiInsights(result);
        try {
            setAiInsights(JSON.parse(insightsText));
        } catch (jsonError) {
            console.error("Failed to parse AI response as JSON:", jsonError);
            setAiInsights(insightsText);
        }
        setIsAiLoading(false);

      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع أثناء معالجة الملف.');
        console.error(`Error processing file '${file.name}': ${err.message}`);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('فشل في قراءة الملف.'); setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [processData]);
  
  const handleReset = useCallback(() => {
    setAnalysis(null); setAiInsights(''); setError(null);
    setCurrentView(user.role === 'admin' ? 'management' : 'uploader');
  }, [user.role]);
  
  const agentNames = useMemo(() => analysis ? Object.keys(analysis.byAgent).sort() : [], [analysis]);
  const selectedAgentData = currentView !== 'overview' && currentView !== 'management' && currentView !== 'map' && analysis ? analysis.byAgent[currentView] : null;

  const renderInitialView = () => (
     <div className="container mx-auto p-4">
        <div role="banner" className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">ابدأ تحليل البيانات</h1>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">ارفع ملف Excel يحتوي على بيانات المشتركين والوكلاء لبدء التحليل الفوري.</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-80 bg-gray-800 rounded-2xl">
            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-center h-80 flex flex-col justify-center max-w-2xl mx-auto" role="alert">
            <strong className="font-bold block mb-2">خطأ!</strong>
            <span className="block">{error}</span>
            <button onClick={() => setError(null)} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 self-center">
              حاول مرة أخرى
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
             <FileUploader onFile={handleFile} />
          </div>
        )}
      </div>
  );

  const renderContent = () => {
    if (!analysis && user.role === 'employee') return renderInitialView();
    if (currentView === 'uploader') return renderInitialView();
    if (currentView === 'management') return <AgentManagement agents={agentConfigs} onAgentsChange={setAgentConfigs} />;

    if (currentView === 'map') return <AgentsMapView agents={agentConfigs} />;
    
    if (analysis && currentView === 'overview') {
      return (
        <div className="space-y-6">
          <div role="banner" className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">نظرة عامة على أداء الشبكة</h1>
              <p className="text-gray-400 mt-1">ملخص شامل لجميع الوكلاء والمشتركين</p>
            </div>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2 mt-4 sm:mt-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7V9a1 1 0 01-2 0V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13V11a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 110-2h2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              تحليل ملف جديد
            </button>
          </div>
          <SummaryCards analysis={analysis} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg">
              <AgentCharts analysis={analysis} />
            </div>
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg">
              <AiInsights insights={aiInsights} isLoading={isAiLoading} analysis={analysis} />
            </div>
          </div>
        </div>
      );
    }
    if (analysis && selectedAgentData) {
      return <AgentDetailView agentName={currentView} agentData={selectedAgentData} />;
    }
    if (!analysis && user.role === 'admin') {
      return (
        <div className="container mx-auto">
          <div role="banner" className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">إعداد لوحة التحكم</h1>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">ابدأ بتعريف وكلائك، ثم ارفع ملف البيانات لبدء التحليل الفوري.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 order-2 lg:order-1">
              <h2 className="text-xl font-bold text-white mb-4 text-center lg:text-right">الخطوة 1: إدارة الوكلاء والمناطق</h2>
              <AgentManagement agents={agentConfigs} onAgentsChange={setAgentConfigs} />
            </div>
            <div className="lg:col-span-2 order-1 lg:order-2">
              <h2 className="text-xl font-bold text-white mb-4 text-center lg:text-right">الخطوة 2: رفع ملف البيانات</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-80 bg-gray-800 rounded-2xl">
                  <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-center h-80 flex flex-col justify-center" role="alert">
                  <strong className="font-bold block mb-2">خطأ!</strong>
                  <span className="block">{error}</span>
                  <button onClick={() => setError(null)} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                    حاول مرة أخرى
                  </button>
                </div>
              ) : (
                <FileUploader onFile={handleFile} />
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        agents={agentNames} 
        currentView={currentView}
        onSelectView={setCurrentView}
        analysisLoaded={!!analysis}
        user={user}
        onLogout={onLogout}
      />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
