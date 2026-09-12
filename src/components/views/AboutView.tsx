import React from 'react';
import { 
  Layers, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Award,
  Globe2,
  FileCheck
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const steps = [
    { num: '01', title: '2D Land Cadastre', desc: 'Baseline survey plot boundary identification and area demarcation' },
    { num: '02', title: '3D Parcel Extrusion', desc: 'Converting flat survey coordinates into volumetric 3D spatial envelopes' },
    { num: '03', title: 'Building Footprint', desc: 'Structural registration with height in meters and floor counts' },
    { num: '04', title: 'Vertical Unit Division', desc: 'Subdividing vertical volumes into apartments, commercial shops, & offices' },
    { num: '05', title: '3D-ULPIN Standard', desc: 'Generating 14+ character standardized alphanumeric digital identity' },
    { num: '06', title: 'MeeSeva Mutation', desc: 'Linking legal titles, deeds, and historical mutation chains' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50 select-none">
      {/* Hero Header */}
      <div className="p-8 bg-gradient-to-r from-brand-900 via-brand-800 to-cyan-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-semibold border border-white/15">
            <Award className="w-3.5 h-3.5" />
            <span>Smart India Hackathon 2026 Solution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            3D-ULPIN: Intelligent 3D Land & Property Information System
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed">
            “3D-ULPIN creates a unified digital identity for land and vertically stacked properties by connecting parcel, building, unit, ownership, and transaction information within an interactive 3D GIS environment.”
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-cyan-200">
            <span>Jurisdiction: Andhra Pradesh, India</span>
            <span>•</span>
            <span>Target Region: Duvvada (Visakhapatnam), Andhra Pradesh</span>
            <span>•</span>
            <span>Cadastral Standard: National Bhu-Aadhaar 3D</span>
          </div>
        </div>
      </div>

      {/* The Core Innovation: 2D Land to 3D Vertical Twin */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">The Innovation</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            2D LAND → 3D PARCEL → 3D BUILDING → VERTICAL PROPERTY UNITS
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Traditional Indian land administration only records the flat 2D ground footprint. 3D-ULPIN revolutionizes this by vertically indexing every apartment, office, and shop stacked in high-rises.
          </p>
        </div>

        {/* Animated Flow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-brand-50/40 hover:border-brand-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-brand-600 text-sm">{s.num}</span>
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">{s.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Problem vs Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            !
          </div>
          <h3 className="text-base font-bold text-slate-900">The Problem: 2D Cadastral Blindness</h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Traditional land records (Pahani / Adangal) only identify the 2D surface plot, unable to distinguish between 10 apartments stacked above it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Apartment owners lack an independent spatial cadastral coordinate, leading to fraudulent duplicate mortgages on the same unit.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Property tax leakages in multi-storey commercial complexes due to lack of accurate floor-by-floor geospatial records.</span>
            </li>
          </ul>
        </div>

        {/* Solution */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">The Solution: 3D-ULPIN System</h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Unified Standard:</strong> Subdivides each vertical building into standardized legal entities: <code>IND-AP-LPxxx-Bxxx-Fxx-xxx</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Interactive 3D Digital Twin:</strong> Explode multi-storey buildings in real-time WebGL space to visually inspect floor ownership.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Fraud Prevention:</strong> Each volumetric apartment has an immutable, georeferenced identity preventing duplicate registrations.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tech Stack & Standards */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          <span>Technical Architecture & Open GIS Stack</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">GIS Engine</span>
            <span className="font-bold text-slate-800">MapLibre GL JS</span>
            <span className="text-[10px] text-slate-500 block">3D Fill Extrusions & Vector Tiles</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">3D Exploder</span>
            <span className="font-bold text-slate-800">Three.js WebGL</span>
            <span className="text-[10px] text-slate-500 block">Vertical Building Exploder & Raycasting</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Data Pipeline</span>
            <span className="font-bold text-slate-800">Papa Parse Engine</span>
            <span className="text-[10px] text-slate-500 block">Real-time CSV ingestion & normalization</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">UI Architecture</span>
            <span className="font-bold text-slate-800">React 18 + Tailwind</span>
            <span className="text-[10px] text-slate-500 block">Smart-city light modern aesthetic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
