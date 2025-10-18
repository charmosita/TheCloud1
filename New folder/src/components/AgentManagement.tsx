import React, { useState, useRef } from 'react';
import { AgentConfig } from '../types';

interface AgentManagementProps {
  agents: AgentConfig[];
  onAgentsChange: (newAgents: AgentConfig[]) => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ agents, onAgentsChange }) => {
  const [agentName, setAgentName] = useState('');
  const [zones, setZones] = useState<string[]>(['']);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentPendingDeletionId, setAgentPendingDeletionId] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleAddZone = () => setZones([...zones, '']);
  const handleZoneChange = (index: number, value: string) => {
    const newZones = [...zones];
    newZones[index] = value;
    setZones(newZones);
  };
  const handleRemoveZone = (index: number) => setZones(zones.filter((_, i) => i !== index));
  
  const resetForm = () => {
    setEditingAgentId(null); setAgentName(''); setZones(['']);
    setLatitude(''); setLongitude('');
  };

  const handleSaveAgent = () => {
    if (!agentName.trim() || zones.some(z => !z.trim())) {
      alert('الرجاء إدخال اسم الوكيل وجميع أسماء المناطق.'); return;
    }
    const agentExists = agents.some(agent => agent.name.toLowerCase() === agentName.trim().toLowerCase());
    if (agentExists) {
      alert('هذا الوكيل موجود بالفعل.'); return;
    }

    const newAgent: AgentConfig = {
      id: crypto.randomUUID(),
      name: agentName.trim(),
      zones: zones.map(z => z.trim()).filter(Boolean),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };

    onAgentsChange([...agents, newAgent]);
    resetForm();
  };
  
  const handleEditAgent = (id: string) => {
    const agentToEdit = agents.find(a => a.id === id);
    if (agentToEdit) {
      setEditingAgentId(id);
      setAgentName(agentToEdit.name);
      setZones(agentToEdit.zones.length > 0 ? [...agentToEdit.zones] : ['']);
      setLatitude(agentToEdit.latitude?.toString() || '');
      setLongitude(agentToEdit.longitude?.toString() || '');
      setAgentPendingDeletionId(null); // Cancel any pending deletion
    }
  };
  
  const handleUpdateAgent = () => {
    if (!editingAgentId) return;
    if (!agentName.trim() || zones.some(z => !z.trim())) {
      alert('الرجاء إدخال اسم الوكيل وجميع أسماء المناطق.'); return;
    }
    
    const agentExists = agents.some(agent => agent.name.toLowerCase() === agentName.trim().toLowerCase() && agent.id !== editingAgentId);
    if (agentExists) {
      alert('اسم الوكيل مستخدم بالفعل لوكيل آخر.'); return;
    }
    
    const agentToUpdate = agents.find(agent => agent.id === editingAgentId);
    if (!agentToUpdate) return;
    
    const updatedData = {
      name: agentName.trim(),
      zones: zones.map(z => z.trim()).filter(Boolean),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };
    
    const updatedAgents = agents.map(agent => 
      agent.id === editingAgentId ? { ...agent, ...updatedData } : agent
    );

    onAgentsChange(updatedAgents);
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!agentPendingDeletionId) return;

    onAgentsChange(agents.filter(agent => agent.id !== agentPendingDeletionId));
    if (editingAgentId === agentPendingDeletionId) {
        resetForm();
    }
    setAgentPendingDeletionId(null);
  };


  const handleExport = () => {
    if (agents.length === 0) {
      alert('لا توجد إعدادات لتصديرها.'); return;
    }
    const dataToExport = agents.map(({id, ...rest}) => rest); // Exclude local ID from export
    const data = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'agent_config.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => importFileRef.current?.click();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedAgentsData: Omit<AgentConfig, 'id'>[] = JSON.parse(text);
        if (Array.isArray(importedAgentsData) && importedAgentsData.every(a => 'name' in a && 'zones' in a)) {
          if (window.confirm(`سيتم استبدال جميع الوكلاء الحاليين بالإعدادات الجديدة. هل تريد المتابعة؟`)) {
            const newAgentsWithIds = importedAgentsData.map(agent => ({
                ...agent,
                id: crypto.randomUUID()
            }));
            onAgentsChange(newAgentsWithIds);
            alert('تم استيراد الإعدادات بنجاح!');
          }
        } else {
          throw new Error('تنسيق الملف غير صالح.');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'خطأ غير معروف';
        console.error(`Failed to import agents from file: ${msg}`);
        alert(`فشل استيراد الملف: ${msg}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handlePasteImport = () => {
    if (!pastedText.trim()) { alert('الرجاء لصق البيانات من Excel أولاً.'); return; }

    const agentsMap = new Map<string, Set<string>>();
    const rows = pastedText.trim().split('\n');
    let currentAgent: string | null = null;

    for (const row of rows) {
        const trimmedRow = row.trim();
        if (!trimmedRow) continue;
        
        const arabicRegex = /[\u0600-\u06FF]/;
        if (arabicRegex.test(trimmedRow)) {
            currentAgent = trimmedRow;
            if (!agentsMap.has(currentAgent)) agentsMap.set(currentAgent, new Set<string>());
        } else if (currentAgent) {
            agentsMap.get(currentAgent)!.add(trimmedRow);
        }
    }

    if (agentsMap.size === 0) {
      alert('لم يتم العثور على بيانات صالحة.'); return;
    }
    
    let newAgentCount = 0;
    let updatedAgentCount = 0;
    const currentAgents = [...agents];

    for (const [name, zonesSet] of agentsMap.entries()) {
        const existingAgentIndex = currentAgents.findIndex(a => a.name.toLowerCase() === name.toLowerCase());
        
        if (existingAgentIndex === -1) {
            // New agent
            const newAgent: AgentConfig = {
                id: crypto.randomUUID(),
                name,
                zones: Array.from(zonesSet).sort(),
            };
            currentAgents.push(newAgent);
            newAgentCount++;
        } else {
            // Existing agent, merge zones
            const existingAgent = currentAgents[existingAgentIndex];
            const combinedZones = new Set([...existingAgent.zones, ...zonesSet]);
            if (combinedZones.size > existingAgent.zones.length) {
                currentAgents[existingAgentIndex] = { ...existingAgent, zones: Array.from(combinedZones).sort() };
                updatedAgentCount++;
            }
        }
    }

    onAgentsChange(currentAgents);
    alert(`اكتمل الاستيراد!\n- وكلاء جدد: ${newAgentCount}\n- وكلاء تم تحديثهم: ${updatedAgentCount}`);
    setPastedText('');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
            <div className='flex items-center gap-4'>
                 <h2 className="text-xl font-bold text-white">الوكلاء المسجلون حاليًا</h2>
                 <div className='flex items-center gap-2'>
                    <button onClick={handleExport} title="تصدير الإعدادات" className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".json" />
                    <button onClick={handleImportClick} title="استيراد الإعدادات من ملف" className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </button>
                 </div>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">قائمة الوكلاء ({agents.length})</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {agents.length > 0 ? (
                agents.map(agent => (
                  <div key={agent.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-start">
                    <div className="flex-grow">
                      <p className="font-bold text-white">{agent.name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agent.zones.map((zone, i) => (
                          <span key={i} className="px-2 py-1 text-xs text-cyan-100 bg-cyan-800/50 rounded-full">{zone}</span>
                        ))}
                      </div>
                       {agent.latitude && agent.longitude && (
                        <p className="text-xs text-gray-400 mt-2 font-mono">
                          Coords: {agent.latitude.toFixed(4)}, {agent.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                       {agentPendingDeletionId === agent.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleConfirmDelete}
                            className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-700"
                            aria-label={`تأكيد حذف ${agent.name}`}
                          >
                            حذف
                          </button>
                          <button
                            onClick={() => setAgentPendingDeletionId(null)}
                            className="px-3 py-1 text-sm text-gray-200 bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 focus:ring-offset-gray-700"
                            aria-label="إلغاء الحذف"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleEditAgent(agent.id)} className="p-2 text-gray-400 hover:text-cyan-400" title="تعديل" aria-label={`تعديل ${agent.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                          </button>
                          <button onClick={() => setAgentPendingDeletionId(agent.id)} className="p-2 text-gray-400 hover:text-red-500" title="حذف" aria-label={`حذف ${agent.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-700 rounded-lg h-full flex flex-col justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="mt-2">لا يوجد وكلاء مسجلون بعد.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">{editingAgentId ? 'تعديل بيانات الوكيل' : 'إضافة وكيل جديد (يدوي)'}</h3>
                <div className="space-y-4">
                  <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="اسم الوكيل" className="w-full px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <div className="flex gap-4">
                    <input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude (e.g. 33.3152)" className="w-1/2 px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    <input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude (e.g. 44.3661)" className="w-1/2 px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">المناطق (الزونات):</label>
                      {zones.map((zone, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                          <input type="text" value={zone} onChange={(e) => handleZoneChange(index, e.target.value)} placeholder={`المنطقة ${index + 1}`} className="flex-grow px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                          {zones.length > 1 && (<button onClick={() => handleRemoveZone(index)} className="p-2 bg-red-600 hover:bg-red-700 rounded-md text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg></button>)}
                      </div>
                      ))}
                      <button onClick={handleAddZone} className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>إضافة منطقة أخرى</button>
                  </div>
                    <div className="flex gap-3">
                        <button onClick={editingAgentId ? handleUpdateAgent : handleSaveAgent} className="w-full px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors duration-300">
                            {editingAgentId ? 'تحديث البيانات' : 'حفظ الوكيل'}
                        </button>
                        {editingAgentId && (<button onClick={resetForm} className="w-full px-4 py-2 font-semibold text-white bg-gray-500 rounded-md hover:bg-gray-600 transition-colors duration-300">إلغاء</button>)}
                    </div>
                </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">استيراد سريع من Excel</h3>
                 <p className="text-sm text-gray-400 mb-2">انسخ البيانات من ملف Excel والصقها هنا. يجب أن يكون التنسيق هو اسم الوكيل في سطر، متبوعًا بأسماء المناطق أو المشتركين في الأسطر التالية.</p>
                <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="الصق البيانات هنا..." className="w-full h-24 px-3 py-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
                <button onClick={handlePasteImport} className="mt-3 w-full px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-300">استيراد البيانات الملصقة</button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AgentManagement;