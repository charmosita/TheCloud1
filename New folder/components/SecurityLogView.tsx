import React from 'react';

const SecurityLogView: React.FC = () => {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold text-white">سجل الأمان</h1>
        <p className="text-gray-400 mt-1">
          تتبع الإجراءات المهمة التي تمت في النظام.
        </p>
      </header>
      <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 p-10">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="mt-4 text-lg font-semibold">الميزة معطلة</p>
          <p>تم تعطيل سجل الأمان لأنه تم إلغاء الاعتمادية على Firebase.</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogView;