import React, { useState, useEffect, useMemo } from 'react';
import { AgentAnalysis, AiAgentInsight, Subscriber } from '../types';
import { getAgentAiInsights } from '../services/geminiService';
import AiInsights from './AiInsights';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// This is a global declaration for the XLSX library loaded from CDN
declare const XLSX: any;

interface AgentDetailViewProps {
    agentName: string;
    agentData: AgentAnalysis;
}

const AgentSummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 space-x-reverse">
        <div className="bg-gray-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const RecentlyExpired: React.FC<{ subscribers: Subscriber[]; agentName: string }> = ({ subscribers, agentName }) => {
    const expiredSubscribers = useMemo(() => {
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);
        today.setHours(23, 59, 59, 999); // End of today
        twoDaysAgo.setHours(0, 0, 0, 0); // Start of two days ago

        return subscribers.filter(sub =>
          sub.status === 'غير فعال' &&
          sub.expirationDate &&
          sub.expirationDate >= twoDaysAgo &&
          sub.expirationDate <= today
        ).sort((a,b) => b.expirationDate!.getTime() - a.expirationDate!.getTime());
    }, [subscribers]);

    const handleExport = () => {
        if (expiredSubscribers.length === 0) return;

        const dataToExport = expiredSubscribers.map(sub => ({
            'اسم المشترك': sub.customerName,
            'رقم الهاتف': sub.phoneNumber,
            'المنطقة': sub.zone,
            'تاريخ الانتهاء': sub.expirationDate?.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expired Subscribers');
        XLSX.writeFile(workbook, `Expired_Subscribers_${agentName}.xlsx`);
    };

    const isFeatureAvailable = subscribers.some(s => s.expirationDate);

    if (!isFeatureAvailable) {
        return (
            <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-700 rounded-lg h-full flex flex-col justify-center items-center">
                <InfoIcon />
                <p className="mt-4 text-lg font-semibold">ميزة تتبع انتهاء الصلاحية غير مفعلة</p>
                <p>لتفعيل هذه الميزة، الرجاء التأكد من وجود عمود باسم <code className="bg-gray-900 text-cyan-300 px-2 py-1 rounded">تاريخ الانتهاء</code> في ملف Excel الخاص بك.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ClockIcon />
                    مشتركون انتهت صلاحيتهم مؤخراً (آخر 48 ساعة)
                </h3>
                {expiredSubscribers.length > 0 && (
                     <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2"
                    >
                        <DownloadIcon />
                        تصدير إلى Excel
                    </button>
                )}
            </div>
            {expiredSubscribers.length === 0 ? (
                <p className="text-center text-gray-400 py-10">لا يوجد مشتركين انتهت صلاحيتهم في اليومين الماضيين.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-700/50 rounded-lg">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="px-5 py-3 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">اسم المشترك</th>
                                <th className="px-5 py-3 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">رقم الهاتف</th>
                                <th className="px-5 py-3 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">المنطقة</th>
                                <th className="px-5 py-3 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">تاريخ الانتهاء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expiredSubscribers.map((sub, index) => (
                                <tr key={`${sub.phoneNumber}-${index}`} className="border-b border-gray-700 hover:bg-gray-700">
                                    <td className="px-5 py-4 text-sm text-white">{sub.customerName}</td>
                                    <td className="px-5 py-4 text-sm text-gray-300 font-mono" dir="ltr">{sub.phoneNumber}</td>
                                    <td className="px-5 py-4 text-sm text-gray-300">{sub.zone}</td>
                                    <td className="px-5 py-4 text-sm text-gray-300">{sub.expirationDate?.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const AgentDetailView: React.FC<AgentDetailViewProps> = ({ agentName, agentData }) => {
    const [insights, setInsights] = useState<AiAgentInsight | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const agentStats = agentData.stats;

    useEffect(() => {
        const fetchInsights = async () => {
            if (agentStats) {
                setIsLoading(true);
                setInsights(null);
                const resultText = await getAgentAiInsights(agentName, agentStats);
                try {
                    const resultJson = JSON.parse(resultText);
                    setInsights(resultJson);
                } catch (e) {
                    console.error("Failed to parse agent insights JSON:", e);
                    setInsights(resultText); // Fallback to raw text on error
                }
                setIsLoading(false);
            }
        };
        fetchInsights();
    }, [agentName, agentStats]);

    const zoneData = Object.entries(agentStats.zoneDistribution).map(([name, value]) => ({ name, value }));
    const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#3b82f6'];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white">
                    تحليل الوكيل: <span className="text-cyan-400">{agentName}</span>
                </h1>
                <p className="text-gray-400 mt-1">نظرة تفصيلية على أداء المشتركين والمناطق</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <AgentSummaryCard title="إجمالي المشتركين" value={agentStats.total} icon={<UsersIcon />} />
                 <AgentSummaryCard title="المشتركين الفعالين" value={agentStats.active} icon={<CheckCircleIcon />} />
                 <AgentSummaryCard title="المشتركين غير الفعالين" value={agentStats.inactive} icon={<XCircleIcon />} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">توزيع المشتركين حسب المنطقة</h3>
                     <div style={{ width: '100%', height: 500 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={zoneData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={150} 
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {zoneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value} مشترك`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg">
                    <AiInsights insights={insights} isLoading={isLoading} analysis={agentData} agentName={agentName} />
                </div>
                <div className="lg:col-span-5 bg-gray-800 p-6 rounded-xl shadow-lg">
                     <RecentlyExpired subscribers={agentData.subscribers} agentName={agentName} />
                </div>
            </div>
        </div>
    );
};

// Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default AgentDetailView;
