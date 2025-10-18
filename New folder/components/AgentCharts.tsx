import React, { useMemo } from 'react';
// FIX: Import `AgentStats` to use for type casting.
import { AnalysisResult, AgentStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AgentChartsProps {
    analysis: AnalysisResult;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-gray-700 border border-gray-600 rounded-md shadow-lg text-white">
                <p className="font-bold">{label}</p>
                <p style={{ color: '#34d399' }}>{`فعال: ${payload[0].value}`}</p>
                <p style={{ color: '#f87171' }}>{`غير فعال: ${payload[1].value}`}</p>
            </div>
        );
    }
    return null;
};

const AgentCharts: React.FC<AgentChartsProps> = ({ analysis }) => {
    
    const barChartData = useMemo(() => {
        // FIX: Cast `agentAnalysis` to provide type information and allow access to `.stats`.
        return Object.entries(analysis.byAgent).map(([name, agentAnalysis]) => ({
            name,
            'فعال': (agentAnalysis as { stats: AgentStats }).stats.active,
            'غير فعال': (agentAnalysis as { stats: AgentStats }).stats.inactive,
        }));
    }, [analysis]);
    
    const zoneData = useMemo(() => {
        const zones: { [key: string]: number } = {};
        // FIX: Cast `agentAnalysis` to provide type information and allow access to `.stats`.
        Object.values(analysis.byAgent).forEach(agentAnalysis => {
            (Object.entries((agentAnalysis as { stats: AgentStats }).stats.zoneDistribution) as [string, number][]).forEach(([zone, count]) => {
                zones[zone] = (zones[zone] || 0) + count;
            });
        });
        return Object.entries(zones).map(([name, value]) => ({ name, value }));
    }, [analysis]);

    const planData = useMemo(() => {
        if (!analysis.planDistribution || Object.keys(analysis.planDistribution).length === 0) {
            return null;
        }
        return Object.entries(analysis.planDistribution).map(([name, value]) => ({ name, value }));
    }, [analysis]);

    const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#3b82f6'];

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div>
                <h3 className="text-xl font-bold text-white mb-4">أداء الوكلاء</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" tick={{ fill: '#a0aec0' }} />
                            <YAxis tick={{ fill: '#a0aec0' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#a0aec0' }} />
                            <Bar dataKey="فعال" fill="#34d399" />
                            <Bar dataKey="غير فعال" fill="#f87171" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-4">توزيع المشتركين حسب المنطقة</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={zoneData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    // FIX: Explicitly type the label props to resolve arithmetic operation error.
                                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {zoneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => {
                                    const percent = ((props.payload?.percent || 0) * 100).toFixed(1);
                                    return [`${value} مشترك (${percent}%)`, name];
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {planData && (
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-4">استخدام الباقات</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie 
                                        data={planData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        // FIX: Explicitly type the label props to resolve arithmetic operation error.
                                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {planData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length].replace('b6d4', 'a5f3fc')} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => {
                                        const percent = ((props.payload?.percent || 0) * 100).toFixed(1);
                                        return [`${value} مشترك (${percent}%)`, name];
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1">
                 <h3 className="text-xl font-bold text-white mb-4">نمو الاشتراكات مع الزمن</h3>
                 <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <LineChart data={analysis.timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="date" tick={{ fill: '#a0aec0' }} angle={-30} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: '#a0aec0' }}/>
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} name="اشتراكات جديدة"/>
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};

export default AgentCharts;