
export interface Subscriber {
  agentName: string;
  customerName: string;
  phoneNumber: string;
  status: 'فعال' | 'غير فعال';
  zone: string;
  subscriptionDate: Date;
  expirationDate?: Date;
  planName?: string;
}

export interface AgentStats {
  total: number;
  active: number;
  inactive: number;
  zoneDistribution: { [key: string]: number };
}

export interface AgentAnalysis {
  stats: AgentStats;
  subscribers: Subscriber[];
}

export interface IgnoredRows {
  unregisteredAgent: number;
  invalidData: number;
  total: number;
}

export interface AnalysisResult {
  totalSubscribers: number;
  totalAgents: number;
  totalActive: number;
  totalInactive: number;
  byAgent: { [key: string]: AgentAnalysis };
  timeline: { date: string; count: number }[];
  planDistribution: { [key: string]: number };
  ignoredRows: IgnoredRows;
}

export interface AgentConfig {
  id: string;
  name: string;
  zones: string[];
  latitude?: number;
  longitude?: number;
}

export interface AiOverviewInsight {
  executiveSummary: string;
  keyStrengths: string[];
  improvementOpportunities: string[];
  recommendations: string[];
}

export interface AiAgentInsight {
  performanceSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Only for creation/update forms
  role: 'admin' | 'employee';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}