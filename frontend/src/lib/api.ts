import { DiagnosticReport, SentinelState, SnowflakeVectorResult } from "@/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://medichain-omni-backend.onrender.com")
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL must be configured to use the backend.");
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export async function fetchSentinelState(): Promise<SentinelState | null> {
  try {
    const res = await fetch(apiUrl("/api/sentinel/state"), { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function executeTigerSQL(query: string): Promise<any> {
  const res = await fetch(apiUrl("/api/sentinel/query"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Tiger Data query failed");
  return await res.json();
}

export async function triggerOutbreakSpike(pincode: string, symptom_name: string, count: number = 380): Promise<any> {
  const res = await fetch(apiUrl("/api/sentinel/trigger-spike"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode, symptom_name, count }),
  });
  if (!res.ok) throw new Error("Failed to trigger outbreak simulation");
  return await res.json();
}

export async function querySnowflakeVectors(query: string, top_k: number = 3): Promise<{ results: SnowflakeVectorResult[]; snowflake_query_id: string; execution_time_ms: number }> {
  const res = await fetch(apiUrl("/api/snowflake/vectors"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k }),
  });
  if (!res.ok) throw new Error("Snowflake vector query failed");
  return await res.json();
}

export async function requestSecondOpinion(
  patient_symptoms: string,
  api_key?: string,
  geo_options?: {
    client_id?: string;
    gps_lat?: number;
    gps_lon?: number;
    gps_accuracy?: number;
    location_pincode?: string;
  }
): Promise<{
  mode: string;
  model?: string;
  report: DiagnosticReport;
  retrieved_kaggle_records?: any[];
  snowflake_meta: any;
  stored_reference_case?: any;
  cross_hospital_alert?: any;
  active_hospital_network?: string[];
  total_dynamic_references_stored?: number;
}> {
  const res = await fetch(apiUrl("/api/gemini/second-opinion"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_symptoms,
      api_key,
      client_id: geo_options?.client_id,
      gps_lat: geo_options?.gps_lat,
      gps_lon: geo_options?.gps_lon,
      gps_accuracy: geo_options?.gps_accuracy,
      location_pincode: geo_options?.location_pincode,
    }),
  });
  if (!res.ok) throw new Error("Diagnostic RAG inference failed");
  return await res.json();
}

export async function fetchStoredReferences(): Promise<{ status: string; count: number; references: any[] }> {
  try {
    const res = await fetch(apiUrl("/api/rag/stored-references"), { cache: "no-store" });
    if (!res.ok) return { status: "ERROR", count: 0, references: [] };
    return await res.json();
  } catch {
    return { status: "ERROR", count: 0, references: [] };
  }
}

export async function fetchCrossHospitalAlerts(): Promise<{ active_alerts: any[]; total_surveillance_cases: number }> {
  try {
    const res = await fetch(apiUrl("/api/sentinel/cross-alerts"), { cache: "no-store" });
    if (!res.ok) return { active_alerts: [], total_surveillance_cases: 0 };
    return await res.json();
  } catch {
    return { active_alerts: [], total_surveillance_cases: 0 };
  }
}

export async function fetchLiveInternetAlerts(): Promise<{ total_alerts: number; alerts: any[]; data_source: string }> {
  try {
    const res = await fetch(apiUrl("/api/sentinel/live-internet-alerts"), { cache: "no-store" });
    if (!res.ok) return { total_alerts: 0, alerts: [], data_source: "" };
    return await res.json();
  } catch {
    return { total_alerts: 0, alerts: [], data_source: "" };
  }
}

export async function recordClinicalPresentation(pincode: string, symptoms: string, diagnosis?: string, hospital?: string): Promise<any> {
  const res = await fetch(apiUrl("/api/sentinel/record-presentation"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode, symptoms, diagnosis, hospital }),
  });
  if (!res.ok) throw new Error("Failed to record clinical presentation");
  return await res.json();
}

export async function requestElevenLabsVoice(text: string, api_key?: string): Promise<{ audioBlob?: Blob; fallbackText?: string }> {
  try {
    const res = await fetch(apiUrl("/api/elevenlabs/tts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, api_key }),
    });
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("audio")) {
      const blob = await res.blob();
      return { audioBlob: blob };
    }
    const data = await res.json();
    return { fallbackText: data.text || text };
  } catch {
    return { fallbackText: text };
  }
}
