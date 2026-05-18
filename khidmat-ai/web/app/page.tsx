"use client";

import React, { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface TraceEntry {
  agent: string;
  phase: string;
  action: string;
  reasoning: string;
}

interface OrchestrationResult {
  session_id: string;
  intent: {
    service_label: string;
    location: string;
    time_expression: string;
  };
  recommended: { name: string; distance_km: number; rating: number };
  booking: {
    booking_id: string;
    slot: string;
    status: string;
    confirmation_message: string;
  };
  trace: TraceEntry[];
  trace_summary?: { outcome: string; steps: number };
}

const getAgentColor = (agent: string) => {
  if (agent.includes("Intent")) return "#38bdf8";
  if (agent.includes("Discovery")) return "#a78bfa";
  if (agent.includes("Ranking")) return "#fbbf24";
  if (agent.includes("Booking")) return "#4ade80";
  if (agent.includes("Follow")) return "#94a3b8";
  if (agent.includes("Trace")) return "#f472b6";
  return "#38bdf8";
};

export default function EvaluatorDashboard() {
  const [input, setInput] = useState("Mujhe kal subah G-13 mein AC technician chahiye");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${API_BASE}/api/orchestrate`, {
        message: input,
        customer_name: "Demo Customer",
      });
      setResult(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Cannot connect to backend. Start it with: cd backend && python run.py");
      }
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    result?.trace.map((t, i) => ({
      name: t.agent.replace("Agent", "").slice(0, 12),
      step: i + 1,
    })) || [];

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-sky-400">KhidmatAI Evaluator Dashboard</h1>
        <p className="text-slate-400 mb-8">6-agent pipeline trace · POST /api/orchestrate</p>

        {error && (
          <div className="bg-red-950/50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/5 flex flex-col gap-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Test a Request</h2>
              <textarea
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 min-h-[100px] text-slate-100"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-lg disabled:opacity-50"
                onClick={runPipeline}
                disabled={loading}
              >
                {loading ? "Running pipeline…" : "Run Agent Pipeline"}
              </button>
            </div>

            {result?.booking && (
              <div className="bg-slate-900 p-6 rounded-xl border border-emerald-800/50">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">Booking Confirmed</h3>
                <p className="text-sm">
                  <span className="text-slate-400">ID:</span> {result.booking.booking_id}
                </p>
                <p className="text-sm">
                  <span className="text-slate-400">Provider:</span> {result.recommended.name}
                </p>
                <p className="text-sm">
                  <span className="text-slate-400">Service:</span> {result.intent.service_label}
                </p>
                <p className="text-sm">
                  <span className="text-slate-400">Slot:</span> {result.booking.slot}
                </p>
                <p className="text-sm mt-2 text-slate-300">{result.booking.confirmation_message}</p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-3/5 bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-6">Agent Reasoning Trace</h2>

            {result?.trace ? (
              <>
                {result.trace_summary?.outcome && (
                  <p className="text-sky-300 mb-6">{result.trace_summary.outcome}</p>
                )}
                <div className="h-48 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#94a3b8" }} />
                      <Tooltip />
                      <Bar dataKey="step" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={getAgentColor(result.trace[index]?.agent || "")} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {result.trace.map((step, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 pl-4 py-2"
                      style={{ borderColor: getAgentColor(step.agent) }}
                    >
                      <p className="font-bold text-sky-300">
                        {idx + 1}. {step.agent}
                      </p>
                      <p className="text-xs text-slate-500">
                        {step.phase} · {step.action}
                      </p>
                      <p className="text-sm text-slate-300 mt-1">{step.reasoning}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded text-slate-500">
                Run the pipeline to see the trace.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
