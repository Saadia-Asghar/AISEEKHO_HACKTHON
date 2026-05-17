"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AgentTraceStep {
  step_number: number;
  agent_name: string;
  action: string;
  output: string | object;
  duration_ms: number;
}

interface Provider {
  name: string;
  [key: string]: unknown;
}

interface Booking {
  booking_id: string;
  provider: Provider;
  service_type: string;
  appointment_time: string;
  estimated_cost_pkr: number;
}

interface PipelineResult {
  booking?: Booking;
  agent_trace?: AgentTraceStep[];
  total_duration_ms?: number;
}

// Color palette mapping based on AgentTraceScreen colors
const getAgentColor = (agentName: string) => {
  switch (agentName) {
    case 'IntentAgent': return '#1A73E8'; // brandPrimary
    case 'DiscoveryAgent': return '#9c27b0';
    case 'RankingAgent': return '#FBBC04'; // brandWarning
    case 'DecisionAgent': return '#34A853'; // brandSecondary
    case 'BookingAgent': return '#009688';
    case 'FollowUpAgent': return '#5F6368'; // textSecondary
    default: return '#1A73E8';
  }
};

export default function EvaluatorDashboard() {
  const [input, setInput] = useState("Mujhe kal subah G-13 mein AC technician chahiye");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post("http://localhost:8000/api/v1/request", {
        user_input: input,
        user_lat: 33.6844,
        user_lng: 73.0479,
        user_id: "demo-user-001"
      });
      setResult(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(JSON.stringify(err.response.data, null, 2));
      } else {
        setError("Cannot connect to backend. Make sure the server is running on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.agent_trace?.map((step: AgentTraceStep) => ({
    name: step.agent_name,
    duration: step.duration_ms,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-600">KhidmatAI Evaluator Dashboard</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
            <h3 className="text-red-800 font-bold">Error</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap mt-2">{error}</pre>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-2/5 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Test a Request</h2>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 min-h-[100px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type request..."
              />
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors flex justify-center items-center"
                onClick={runPipeline}
                disabled={loading}
              >
                {loading ? "Processing Pipeline..." : "Run Agent Pipeline"}
              </button>
            </div>

            {result?.booking && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200 bg-green-50/30">
                <h3 className="text-lg font-bold text-green-800 mb-2">Booking Confirmed</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-600">ID:</span> <span className="font-mono">{result.booking.booking_id}</span></p>
                  <p><span className="font-semibold text-gray-600">Provider:</span> {result.booking.provider.name}</p>
                  <p><span className="font-semibold text-gray-600">Service:</span> {result.booking.service_type}</p>
                  <p><span className="font-semibold text-gray-600">Time:</span> {new Date(result.booking.appointment_time).toLocaleString()}</p>
                  <p><span className="font-semibold text-gray-600">Cost:</span> PKR {result.booking.estimated_cost_pkr}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-3/5 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6">Agent Reasoning Trace</h2>
            
            {result?.agent_trace ? (
              <>
                <div className="h-64 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} fontSize={12} />
                      <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} fontSize={12} />
                      <Tooltip formatter={(val) => [`${val} ms`, 'Duration']} />
                      <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry: {name: string; duration: number}, index: number) => (
                          <Cell key={`cell-${index}`} fill={getAgentColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Step</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Agent</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Output Summary</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.agent_trace.map((step: AgentTraceStep, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{step.step_number}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: getAgentColor(step.agent_name) }}>
                            {step.agent_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{step.action}</td>
                          <td className="px-4 py-3 truncate max-w-xs" title={JSON.stringify(step.output)}>
                            {typeof step.output === 'object' ? JSON.stringify(step.output).substring(0, 50) + '...' : step.output}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-mono">{step.duration_ms}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 text-right">
                  <p className="text-2xl font-bold text-gray-800">
                    Total Pipeline: <span className="text-blue-600">{result.total_duration_ms}ms</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-400">
                Run the pipeline to see the trace.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
