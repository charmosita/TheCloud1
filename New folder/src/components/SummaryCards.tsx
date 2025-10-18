

import React from 'react';
import { AnalysisResult } from '../types';

interface SummaryCardsProps {
    analysis: AnalysisResult;
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement, tooltip?: string }> = ({ title, value, icon, tooltip }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 space-x-reverse" title={tooltip}>
        <div className="bg-gray-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ analysis }) => {
    
    const ignoredTooltip = analysis.ignoredRows.total > 0 ? 
        `${analysis.ignoredRows.unregisteredAgent} صف بسبب وكيل غير مسجل.\n${analysis.ignoredRows.invalidData} صف بسبب بيانات ناقصة (مثل التاريخ).`
        : "تمت معالجة جميع الصفوف بنجاح.";

    // FIX: Explicitly type the `cards` array to allow for the optional `tooltip` property.
    // The type was previously inferred from the initial elements which did not have `tooltip`,
    // causing an error when trying to push an object with a `tooltip`.
    const cards: { title: string; value: string | number; icon: React.ReactElement; tooltip?: string; }[] = [
        { title: 'إجمالي المشتركين', value: analysis.totalSubscribers, icon: <UsersIcon /> },
        { title: 'إجمالي الوكلاء', value: analysis.totalAgents, icon: <BriefcaseIcon /> },
        { title: 'المشتركين الفعالين', value: analysis.totalActive, icon: <CheckCircleIcon /> },
        { title: 'المشتركين غير الفعالين', value: analysis.totalInactive, icon: <XCircleIcon /> },
    ];
    
    // Conditionally add the ignored rows card if there are any
    if (analysis.ignoredRows && analysis.ignoredRows.total > 0) {
        cards.push(
             { title: 'بيانات تم تجاهلها', value: analysis.ignoredRows.total, icon: <WarningIcon />, tooltip: ignoredTooltip }
        );
    }


    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cards.length} gap-6`}>
            {cards.map(card => <SummaryCard key={card.title} {...card} />)}
        </div>
    );
}

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


export default SummaryCards;