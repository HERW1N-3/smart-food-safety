import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Package, 
  Truck, 
  Warehouse, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  ChevronRight,
  Info,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type AppTab = 'dashboard' | 'products' | 'alerts' | 'traceability';

interface Product {
  product_id: number;
  batch_id: number;
  expiry_date: string;
  price: number;
  harvest_date: string;
  farm_location: string;
  alert_count: number;
}

interface Alert {
  alert_id: number;
  product_id: number;
  reason: string;
  severity: string;
  expiry_date: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<{ farm_count: number; product_count: number; alert_count: number } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [safetyCheck, setSafetyCheck] = useState<{ status: string; reason: string; aiExplanation?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) { console.error(e); }
  };

  const handleProductSelect = async (id: number) => {
    setSelectedProduct(id);
    setActiveTab('traceability');
    setSafetyCheck(null);
    try {
      const res = await fetch(`/api/product/${id}`);
      const data = await res.json();
      setProductDetails(data);
    } catch (e) { console.error(e); }
  };

  const runSafetyCheck = async (id: number) => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/check/${id}`);
      const data = await res.json();
      
      // Bonus: Enhance explanation with Gemini
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a food safety expert, explain why this product (ID: ${id}) is ${data.status}. 
                   Raw data: ${data.reason}. 
                   Keep the explanation simple, human-friendly, and informative for a consumer. 
                   If unsafe, provide a clear warning.`
      });
      
      setSafetyCheck({ 
        ...data, 
        aiExplanation: aiResponse.text 
      });
    } catch (e) { 
      console.error(e); 
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f0f2f5] font-sans flex overflow-hidden">
      {/* Sidebar / Navigation */}
      <aside className="w-60 border-r border-[#2d323b] flex flex-col gap-10 p-7 shrink-0 bg-[#0f1115] h-screen fixed left-0 top-0">
        <div className="flex items-center gap-2.5 font-extrabold text-[#388bfd] text-lg tracking-wider">
          <span className="text-2xl">◈</span>
          <span>FOODTRACE</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavBtn icon={<BarChart3 size={18} />} label="System Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavBtn icon={<Package size={18} />} label="Inventory Audit" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavBtn icon={<Activity size={18} />} label="Traceability Logs" active={activeTab === 'traceability'} onClick={() => setActiveTab('traceability')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 bg-[#0f1115] min-h-screen overflow-auto">
        <div className="max-w-6xl mx-auto p-10 flex flex-col gap-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-10"
              >
                <header>
                  <h1 className="text-2xl font-semibold mb-1">System Infrastructure</h1>
                  <p className="text-[#8b949e] text-sm">Real-time supply chain monitoring and diagnostic logs.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Production" value={stats?.product_count || products.length} />
                  <StatCard label="Critical Alerts" value={stats?.alert_count || alerts.length} alert />
                  <StatCard label="Monitored Facilities" value={stats?.farm_count || 2} />
                </div>

                <div className="bg-[#1a1d23] border border-[#2d323b] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[#8b949e] mb-6">Recent Batch Activity</h3>
                  <div className="flex flex-col">
                    {products.slice(0, 5).map(p => (
                      <div key={p.product_id} className="flex items-center justify-between py-4 border-b border-[#2d323b] last:border-0 hover:bg-white/5 transition-colors cursor-pointer px-2" onClick={() => handleProductSelect(p.product_id)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${p.alert_count > 0 ? 'bg-[#da3333]' : 'bg-[#238636]'}`} />
                          <div>
                            <p className="font-mono text-xs text-[#f0f2f5]">BATCH-{p.product_id.toString().padStart(4, '0')}</p>
                            <p className="text-[11px] text-[#8b949e]">{p.farm_location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="font-mono text-[10px] text-[#8b949e]">{p.expiry_date}</span>
                          <ChevronRight size={14} className="text-[#2d323b]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-10"
              >
                <header>
                  <h1 className="text-2xl font-semibold mb-1">Inventory Audit</h1>
                  <p className="text-[#8b949e] text-sm">Detailed logs of all product units across the platform.</p>
                </header>

                <div className="bg-[#1a1d23] border border-[#2d323b] rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1a1d23] border-b border-[#2d323b]">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">Instance ID</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">Facility Origin</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">Shelf Life Limit</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">Unit Price</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d323b]">
                      {products.map(p => (
                        <tr key={p.product_id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-5 font-mono text-xs text-[#388bfd]">BATCH-{p.product_id.toString().padStart(4, '0')}</td>
                          <td className="px-6 py-5 text-xs font-medium">{p.farm_location}</td>
                          <td className="px-6 py-5 text-xs text-[#8b949e]">{p.expiry_date}</td>
                          <td className="px-6 py-5 text-xs font-mono text-[#f0f2f5]">${p.price.toFixed(2)}</td>
                          <td className="px-6 py-5">
                            <button 
                              onClick={() => handleProductSelect(p.product_id)}
                              className="text-[#8b949e] group-hover:text-[#388bfd] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                            >
                              Trace Lifecycle <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'traceability' && (
              <motion.div
                key="traceability"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8"
              >
                {!productDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-16 h-16 bg-[#1a1d23] border border-[#2d323b] rounded-full flex items-center justify-center text-[#8b949e]">
                      <Search size={32} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">No Batch Selected</h2>
                      <p className="text-[#8b949e] text-sm max-w-xs mx-auto mt-2">Please select a product from the Inventory Audit or Dashboard to view its detailed supply chain logs.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="mt-4 px-6 py-2.5 bg-[#388bfd] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Browse Inventory
                    </button>
                  </div>
                ) : (
                  <>
                    <header className="flex justify-between items-center bg-[#1a1d23] p-6 border border-[#2d323b] rounded-2xl">
                  <div>
                    <h1 className="text-xl font-bold mb-1 font-mono text-[#388bfd]">BATCH_TRACE #{productDetails.product_id.toString().padStart(4, '0')}</h1>
                    <p className="text-[#8b949e] text-xs font-mono uppercase tracking-widest underline decoration-[#388bfd]/30 underline-offset-4">Supply Chain Path: {productDetails.farm_location} → Regional Hub</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-[0.2em] uppercase border ${alerts.some(a => a.product_id === productDetails.product_id) ? 'bg-[#da3633] border-[#da3633] text-white' : 'bg-[#238636] border-[#238636] text-white'}`}>
                    {alerts.some(a => a.product_id === productDetails.product_id) ? 'Status: Critical Breach' : 'Status: Optimal Operating'}
                  </div>
                </header>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Visual Trace Flow */}
                  <div className="flex-1 bg-[#1a1d23] border border-[#2d323b] rounded-2xl p-8 flex flex-col gap-10">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b949e] flex justify-between items-center">
                      Traceability Lifecycle <span>Node Visualization</span>
                    </h3>

                    <div className="trace-view flex flex-col">
                      <TraceNode 
                        nodeId="01"
                        title={productDetails.farm_location}
                        meta={`Facility ID: F-${productDetails.farm_id} • Harvest: 2024-03-10`}
                        data={<>Pesticide: <b>{productDetails.pesticide_used}</b> Soil Mode: <b>Optimal</b></>}
                      />
                      <TraceNode 
                        nodeId="02"
                        title="Thermal Distribution"
                        meta="Distribution ID: T-44 • Interval: 14h"
                        data={<>Avg Temp: <b>{productDetails.transport_temp || '8.2'}°C</b> Humidity: <b>{productDetails.transport_humidity || '72'}%</b></>}
                        alert={productDetails.transport_temp > 10}
                      />
                      <TraceNode 
                        nodeId="03"
                        title="Retail Destination"
                        meta="Market ID: R-22 • Availability: Retail"
                        data={<>Price Log: <b>${productDetails.price}</b> Life Target: <b>{productDetails.expiry_date}</b></>}
                        isLast
                      />
                    </div>
                  </div>

                  {/* Safety Check Panel */}
                  <div className="w-full md:w-96 flex flex-col gap-6 shrink-0">
                    <div className="bg-[#1a1d23] border border-[#2d323b] rounded-2xl p-8 sticky top-10">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#8b949e] mb-8">Explainable Safety Diagnostic</h3>
                      
                      {!safetyCheck && (
                        <div className="flex flex-col gap-6">
                          <p className="text-xs text-[#8b949e] leading-relaxed">Cross-referencing multi-point sensor arrays to verify structural and chemical integrity of the current batch.</p>
                          <button 
                            disabled={isChecking}
                            onClick={() => runSafetyCheck(productDetails.product_id)}
                            className="w-full py-4 bg-[#388bfd] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isChecking ? "Compiling Logs..." : "Initiate System Audit"}
                          </button>
                        </div>
                      )}

                      {safetyCheck && (
                        <div className="flex flex-col gap-8">
                          <div className={`p-6 border border-[#2d323b] rounded-xl text-center flex flex-col items-center gap-4 ${safetyCheck.status === 'SAFE' ? 'bg-[#238636]/10 text-[#238636]' : 'bg-[#da3633]/10 text-[#da3633]'}`}>
                            <div className="text-3xl font-black font-mono tracking-tighter">{safetyCheck.status === 'SAFE' ? 'SAFE' : 'UNSAFE'}</div>
                            <div className="w-10 h-0.5 bg-current opacity-30" />
                            <p className="text-[10px] uppercase tracking-widest font-bold font-mono">STATUS_LOG: {safetyCheck.status}</p>
                          </div>
                          
                          <div className="bg-[#0f1115] p-5 rounded-xl border border-[#2d323b] border-l-4 border-l-[#388bfd]">
                            <p className="text-[9px] font-bold text-[#8b949e] uppercase tracking-widest mb-4 flex items-center gap-1.5 underline underline-offset-4 decoration-[#388bfd]">
                              AI Audit Report
                            </p>
                            <p className="text-[11px] leading-relaxed text-[#f0f2f5] italic font-serif">
                              {safetyCheck.aiExplanation}
                            </p>
                          </div>

                          <button 
                            onClick={() => setSafetyCheck(null)}
                            className="text-[10px] text-[#8b949e] font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
                          >
                            Reset Diagnostic
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-semibold text-xs transition-all duration-300 ${active ? 'bg-[#388bfd]/10 text-[#388bfd]' : 'text-[#8b949e] hover:text-[#f0f2f5] hover:bg-white/5'}`}
    >
      <span className={active ? 'text-[#388bfd]' : 'text-[#8b949e]'}>{icon}</span>
      <span className="uppercase tracking-[0.1em]">{label}</span>
      {active && <div className="ml-auto w-1 h-1 bg-[#388bfd] rounded-full" />}
    </button>
  );
}

function StatCard({ label, value, alert }: { label: string, value: number | string, alert?: boolean }) {
  return (
    <div className="bg-[#1a1d23] border border-[#2d323b] rounded-xl p-5 shadow-sm">
      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-2xl font-semibold font-mono tracking-tight ${alert ? 'text-[#da3633]' : 'text-[#f0f2f5]'}`}>
        {value}
      </p>
    </div>
  );
}

function TraceNode({ nodeId, title, meta, data, alert, isLast }: { nodeId: string, title: string, meta: string, data: any, alert?: boolean, isLast?: boolean }) {
  return (
    <div className="relative pl-12 pb-10">
      {!isLast && <div className="absolute left-[15px] top-6 bottom-0 w-[1px] bg-[#2d323b]" />}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border border-[#2d323b] bg-[#0f1115] flex items-center justify-center font-mono text-[10px] font-bold z-10 transition-all ${alert ? 'border-[#da3633] text-[#da3633] shadow-[0_0_15px_rgba(218,54,51,0.2)]' : 'text-[#8b949e]'}`}>
        {alert ? '!' : nodeId}
      </div>
      <div className="flex flex-col gap-1.5">
        <h4 className={`text-xs font-bold ${alert ? 'text-[#da3633]' : 'text-[#f0f2f5]'}`}>{title}</h4>
        <p className="text-[10px] text-[#8b949e] font-mono">{meta}</p>
        <div className={`mt-3 p-3 bg-black/30 border-l-2 border-[#2d323b] rounded-r-md text-[10px] font-mono flex flex-wrap gap-x-6 gap-y-2 ${alert ? 'border-[#da3633]' : ''}`}>
           {data}
        </div>
      </div>
    </div>
  );
}
