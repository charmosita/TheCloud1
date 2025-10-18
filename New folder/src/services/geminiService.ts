
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Add AgentAnalysis to type imports for clarity and type safety.
import { AnalysisResult, AgentAnalysis, AgentStats } from '../types';

export const getOverviewAiInsights = async (analysis: AnalysisResult): Promise<string> => {
  // FIX: Removed manual API_KEY check as per guidelines. Assume process.env.API_KEY is available.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const planSummary = Object.keys(analysis.planDistribution).length > 0 ?
    `\nتوزيع استخدام الباقات:\n${Object.entries(analysis.planDistribution)
      .map(([plan, count]) => `- ${plan}: ${count} مشترك`)
      .join('\n')}`
    : '';

  const summary = `
    إجمالي المشتركين: ${analysis.totalSubscribers}
    إجمالي الوكلاء: ${analysis.totalAgents}
    إجمالي المشتركين الفعالين: ${analysis.totalActive}
    إجمالي المشتركين غير الفعالين: ${analysis.totalInactive}
    
    تفاصيل لكل وكيل:
    ${Object.entries(analysis.byAgent)
      .map(
        // FIX: The value from analysis.byAgent is an `AgentAnalysis` object.
        // The properties `total`, `active`, and `inactive` exist on its nested `stats` property.
        ([agent, agentAnalysis]) =>
          `- ${agent}: ${agentAnalysis.stats.total} مشترك (${agentAnalysis.stats.active} فعال, ${agentAnalysis.stats.inactive} غير فعال)`
      )
      .join('\n')}
    ${planSummary}
  `;

  const prompt = `
    أنت خبير في تحليل بيانات شركات تزويد خدمة الإنترنت. بالنظر إلى ملخص البيانات التالي، قدم لي رؤى وتحليلات مفيدة باللغة العربية.
    
    البيانات:
    ${summary}

    أريد أن تكون الإجابة على شكل كائن JSON يتبع البنية المحددة بدقة. ركز على النقاط التالية في تحليلك:
    1.  **executiveSummary**: قدم ملخصًا تنفيذيًا عن الوضع العام للشبكة.
    2.  **keyStrengths**: حدد نقاط القوة الرئيسية، مثل أفضل الوكلاء أداءً أو الباقات الأكثر شعبية.
    3.  **improvementOpportunities**: أشر إلى فرص التحسين، مثل الوكلاء الأقل أداءً أو ملاحظات حول التوزيع الجغرافي أو الباقات الأقل استخداماً.
    4.  **recommendations**: قدم توصيات واضحة وقابلة للتنفيذ لتحسين الأعمال وزيادة عدد المشتركين الفعالين.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING, description: "ملخص تنفيذي عن الوضع العام للشبكة." },
            keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بنقاط القوة الرئيسية." },
            improvementOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بفرص التحسين المتاحة." },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بالتوصيات المقترحة." },
          },
          required: ["executiveSummary", "keyStrengths", "improvementOpportunities", "recommendations"],
        },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "عذرًا، حدث خطأ أثناء محاولة الحصول على رؤى من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
  }
};


export const getAgentAiInsights = async (agentName: string, stats: AgentStats): Promise<string> => {
  // FIX: Removed manual API_KEY check as per guidelines. Assume process.env.API_KEY is available.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = `
    بيانات الوكيل: ${agentName}
    إجمالي المشتركين: ${stats.total}
    المشتركين الفعالين: ${stats.active}
    المشتركين غير الفعالين: ${stats.inactive}
    توزيع المشتركين حسب المنطقة:
    ${Object.entries(stats.zoneDistribution)
      .map(([zone, count]) => `- ${zone}: ${count} مشترك`)
      .join('\n')}
  `;

  const prompt = `
    أنت خبير في تحليل أداء وكلاء شركات تزويد خدمة الإنترنت. بالنظر إلى بيانات الوكيل التالية، قدم لي رؤى وتحليلات مفصلة باللغة العربية.
    
    البيانات:
    ${summary}

    أريد أن تكون الإجابة على شكل كائن JSON يتبع البنية المحددة بدقة. ركز على النقاط التالية في تحليلك:
    1.  **performanceSummary**: قدم ملخصًا سريعًا للأداء العام للوكيل بناءً على نسبة المشتركين الفعالين إلى غير الفعالين.
    2.  **strengths**: حدد نقاط القوة لدى الوكيل، مثل التركيز الناجح في منطقة معينة.
    3.  **weaknesses**: حدد نقاط الضعف أو المناطق التي تتطلب تركيزًا أكبر.
    4.  **recommendations**: قدم توصيات محددة لهذا الوكيل لتحسين أدائه وزيادة قاعدة مشتركينه الفعالين.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
       config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            performanceSummary: { type: Type.STRING, description: "ملخص سريع عن أداء الوكيل." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بنقاط القوة." },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بنقاط الضعف أو فرص التحسين." },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بالتوصيات المخصصة للوكيل." },
          },
          required: ["performanceSummary", "strengths", "weaknesses", "recommendations"],
        },
      }
    });
    return response.text;
  } catch (error) {
    console.error(`Error calling Gemini API for agent ${agentName}:`, error);
    return "عذرًا، حدث خطأ أثناء محاولة تحليل بيانات هذا الوكيل. يرجى المحاولة مرة أخرى.";
  }
};