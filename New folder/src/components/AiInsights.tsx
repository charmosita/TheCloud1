
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { AiOverviewInsight, AiAgentInsight, AnalysisResult, AgentAnalysis, ChatMessage } from '../types';

interface AiInsightsProps {
    insights: AiOverviewInsight | AiAgentInsight | string | null;
    isLoading: boolean;
    analysis: AnalysisResult | AgentAnalysis | null;
    agentName?: string;
}

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg">
        <h4 className="font-bold text-cyan-300 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h4>
        <div className="text-gray-300 space-y-2 text-sm">
            {children}
        </div>
    </div>
);

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
             <div key={i} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="h-5 w-1/3 bg-gray-600 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-600 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

const AiInsights: React.FC<AiInsightsProps> = ({ insights, isLoading, analysis, agentName }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    useEffect(() => {
        if (analysis && !chat) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let summary = '';
                
                if (agentName && analysis && 'stats' in analysis) {
                    const agentAnalysis = analysis as AgentAnalysis;
                    summary = `
                        Agent Name: ${agentName}
                        - Total Subscribers: ${agentAnalysis.stats.total}
                        - Active Subscribers: ${agentAnalysis.stats.active}
                        - Inactive Subscribers: ${agentAnalysis.stats.inactive}

                        Zone Distribution:
                        ${Object.entries(agentAnalysis.stats.zoneDistribution).map(([zone, count]) => `- ${zone}: ${count} subscribers`).join('\n')}
                    `;
                } else if (!agentName && analysis && 'totalSubscribers' in analysis) {
                    const fullAnalysis = analysis as AnalysisResult;
                     const planSummary = Object.keys(fullAnalysis.planDistribution).length > 0 ?
                        `Plan Distribution:\n${Object.entries(fullAnalysis.planDistribution)
                          .map(([plan, count]) => `- ${plan}: ${count} subscribers`)
                          .join('\n')}`
                        : '';

                    summary = `
                        Overall Summary:
                        - Total Subscribers: ${fullAnalysis.totalSubscribers}
                        - Total Agents: ${fullAnalysis.totalAgents}
                        - Active Subscribers: ${fullAnalysis.totalActive}
                        - Inactive Subscribers: ${fullAnalysis.totalInactive}

                        Top 5 agents by subscribers:
                        ${Object.entries(fullAnalysis.byAgent).sort(([, a], [, b]) => b.stats.total - a.stats.total).slice(0, 5).map(([name, data]) => `- ${name}: ${data.stats.total} subscribers`).join('\n')}

                        ${planSummary}
                    `;
                }
                
                if (summary) {
                    const initialContext = `You are a helpful data analyst for an internet service provider in Iraq. Your goal is to answer questions based on the following data summary. Provide concise and clear answers in Arabic. The data is about internet subscribers and agents.\n\nData Context:\n${summary}`;
                    
                    const chatSession = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        history: [
                            { role: 'user', parts: [{ text: initialContext }] },
                            { role: 'model', parts: [{ text: "مفهوم. لقد قمت بتحليل ملخص البيانات. أنا مستعد للإجابة على أسئلتك." }] },
                        ],
                    });
                    setChat(chatSession);
                }
            } catch (error) {
                console.error("Failed to initialize chat session:", error);
            }
        }
    }, [analysis, chat, agentName]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isChatLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        setChatHistory(prev => [...prev, userMessage]);
        setIsChatLoading(true);
        const currentInput = userInput;
        setUserInput('');

        try {
            const response = await chat.sendMessage({ message: currentInput });
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "عذراً، لقد واجهت خطأ. يرجى المحاولة مرة أخرى." };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <SkeletonLoader />;
        }

        if (!insights) {
            return <div className="text-center text-gray-500">لم يتم إنشاء أي تحليلات بعد.</div>;
        }

        if (typeof insights === 'string') {
            return <div className="text-red-400">{insights}</div>;
        }

        if ('executiveSummary' in insights) {
            const overview = insights as AiOverviewInsight;
            return (
                <div className="space-y-4">
                    <InsightCard title="الملخص التنفيذي" icon={<SummaryIcon/>}>
                        <p>{overview.executiveSummary}</p>
                    </InsightCard>
                    <InsightCard title="نقاط القوة" icon={<StrengthsIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{overview.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                    <InsightCard title="فرص للتحسين" icon={<OpportunitiesIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{overview.improvementOpportunities.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                    <InsightCard title="توصيات" icon={<RecommendationsIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{overview.recommendations.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                </div>
            );
        }

        if ('performanceSummary' in insights) {
            const agent = insights as AiAgentInsight;
            return (
                <div className="space-y-4">
                    <InsightCard title="ملخص الأداء" icon={<SummaryIcon/>}>
                        <p>{agent.performanceSummary}</p>
                    </InsightCard>
                    <InsightCard title="نقاط القوة" icon={<StrengthsIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{agent.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                    <InsightCard title="نقاط الضعف" icon={<WeaknessesIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{agent.weaknesses.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                    <InsightCard title="توصيات" icon={<RecommendationsIcon/>}>
                        <ul className="list-disc pr-4 space-y-1">{agent.recommendations.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </InsightCard>
                </div>
            );
        }
        
        return <div className="text-center text-gray-500">تنسيق التحليل غير معروف.</div>;
    };
    
    return (
        <div className="flex flex-col h-full">
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    تحليل الذكاء الاصطناعي
                </h3>
                <div className="bg-gray-800 p-4 rounded-lg overflow-y-auto max-h-[500px]">
                   {renderContent()}
                </div>
            </div>

            {chat && (
                <div className="mt-4 flex flex-col flex-grow bg-gray-800 rounded-lg">
                    <div className="border-t border-gray-700 p-4">
                        <h4 className="font-bold text-white flex items-center gap-2"><ChatIcon/> اسأل سؤال متابعة</h4>
                    </div>
                    <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto" style={{maxHeight: '300px'}}>
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-xs px-4 py-2 rounded-xl bg-gray-700 text-gray-200">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="مثال: أي وكيل لديه أكبر عدد من المشتركين غير الفعالين؟"
                                className="flex-grow px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isChatLoading}
                            />
                            <button type="submit" className="px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={isChatLoading || !userInput.trim()}>
                                <SendIcon />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// Icons
const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const StrengthsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
const OpportunitiesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /><path fillRule="evenodd" d="M12.5 10a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM10 12.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg>;
const RecommendationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>;
const WeaknessesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 10-2 0v2a1 1 0 102 0v-2zm4-2a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.083-3.083A6.992 6.992 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.72 14.28A6.993 6.993 0 0010 15c3.309 0 6-2.691 6-6s-2.691-6-6-6-6 2.691-6 6c0 1.25.363 2.404 1.002 3.416l-1.002 2.863 2.72-1z" clipRule="evenodd" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

export default AiInsights;