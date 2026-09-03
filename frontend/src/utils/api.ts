const API_BASE = "http://127.0.0.1:5000/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "API request failed");
    }
    return json;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Dashboard
  getKPIs: () => fetchAPI("/dashboard/kpis"),
  getTimeline: () => fetchAPI("/dashboard/timeline"),

  // Batches
  getBatches: () => fetchAPI("/batches"),
  createBatch: (name: string, cases: any[]) => 
    fetchAPI("/batches", {
      method: "POST",
      body: JSON.stringify({ name, cases }),
    }),

  // Cases
  getCases: (status?: string, batch_id?: string) => {
    let url = "/cases";
    const params = [];
    if (status) params.push(`status=${status}`);
    if (batch_id) params.push(`batch_id=${batch_id}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    return fetchAPI(url);
  },
  getCaseById: (id: string) => fetchAPI(`/cases/${id}`),
  updateCase: (id: string, updateData: any) => 
    fetchAPI(`/cases/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),
  generateOutreach: (id: string) => 
    fetchAPI(`/cases/${id}/outreach`, {
      method: "POST",
    }),
  customerReply: (id: string, reply: string) => 
    fetchAPI(`/cases/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    }),
  confirmPayment: (id: string) => 
    fetchAPI(`/cases/${id}/confirm-payment`, {
      method: "POST",
    }),
  getAuditLogs: (caseId?: string) => {
    const url = caseId ? `/cases/audit-logs?case_id=${caseId}` : "/cases/audit-logs";
    return fetchAPI(url);
  },

  // Playbooks
  getPlaybook: () => fetchAPI("/playbooks"),
  updatePlaybook: (playbookData: any) => 
    fetchAPI("/playbooks", {
      method: "PUT",
      body: JSON.stringify(playbookData),
    }),
};
