'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AgencyManagement() {
    const [tab, setTab] = useState('pending');
    const [expandedAgency, setExpandedAgency] = useState<string | null>('1');

    const agencies = [
        { id: '1', name: 'Sunshine Tours Ltd.', ruc: '99281', date: 'Oct 12, 2023', status: 'pending', docs: 3, logo: '☀️' },
        { id: '2', name: 'Coastal Adventures', ruc: '11023', date: 'Sep 28, 2023', status: 'verified', logo: '🌊' },
        { id: '3', name: 'Mountain Treks Inc.', ruc: '44120', date: 'Aug 15, 2023', status: 'suspended', logo: '⛰️' },
        { id: '4', name: 'Urban Escapes', ruc: '88321', date: 'Oct 14, 2023', status: 'pending', docs: 2, logo: '🏙️' },
        { id: '5', name: 'Paradise Found', ruc: '11559', date: 'Sep 10, 2023', status: 'verified', logo: '🏝️' },
    ];

    const documents = [
        { name: 'Business_License_2024.pdf', size: '2.4 MB', type: 'pdf' },
        { name: 'Tax_Clearance_Cert.jpg', size: '1.1 MB', type: 'image' },
        { name: 'Liability_Insurance.pdf', size: '3.8 MB', type: 'pdf' },
    ];

    const filteredAgencies = agencies.filter(a => tab === 'pending' ? a.status === 'pending' : tab === 'verified' ? a.status === 'verified' : a.status === 'suspended');

    return (
        <div className="min-h-screen bg-[#101622]">
            <header className="border-b border-[#324467] px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">←</Link>
                    <div className="flex-1">
                        <h1 className="text-white font-bold text-xl">Agency Validation</h1>
                        <p className="text-[#92a4c9] text-sm">Review and approve tourism agencies</p>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Search by Agency Name or ID" className="w-80 h-10 bg-[#192233] border border-[#324467] rounded-lg px-4 text-white placeholder:text-[#92a4c9] outline-none text-sm" />
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-[#324467] px-6">
                {[
                    { key: 'pending', label: 'Pending Review' },
                    { key: 'verified', label: 'Verified' },
                    { key: 'suspended', label: 'Suspended' },
                ].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-4 text-sm font-bold transition-colors border-b-2 ${tab === t.key ? 'border-[#1152d4] text-[#1152d4]' : 'border-transparent text-[#92a4c9] hover:text-white'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {filteredAgencies.map((agency) => (
                    <div key={agency.id} className="mb-4 bg-[#192233] rounded-xl border border-[#324467] overflow-hidden">
                        {/* Agency Header */}
                        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5" onClick={() => setExpandedAgency(expandedAgency === agency.id ? null : agency.id)}>
                            <div className="w-14 h-14 rounded-lg bg-[#1152d4]/20 flex items-center justify-center text-2xl relative">
                                {agency.logo}
                                {agency.status === 'pending' && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#f59e0b] rounded-full flex items-center justify-center text-xs border-2 border-[#192233]">⏳</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold">{agency.name}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${agency.status === 'verified' ? 'bg-[#10b981]/20 text-[#10b981]' : agency.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                                        {agency.status}
                                    </span>
                                </div>
                                <p className="text-[#92a4c9] text-sm">ID: #{agency.ruc} • {agency.date}</p>
                                {agency.docs && <p className="text-[#92a4c9] text-xs mt-1">📄 {agency.docs} documents awaiting review</p>}
                            </div>
                            <span className="text-[#92a4c9]">{expandedAgency === agency.id ? '▼' : '▶'}</span>
                        </div>

                        {/* Expanded Documents Section */}
                        {expandedAgency === agency.id && agency.status === 'pending' && (
                            <div className="px-4 pb-4 bg-black/20">
                                <div className="border-t border-[#324467] pt-4 mb-4" />
                                <h4 className="text-[#92a4c9] text-xs font-bold uppercase tracking-wider mb-3">Document Validation</h4>
                                <div className="space-y-3">
                                    {documents.map((doc, i) => (
                                        <div key={i} className="flex items-center p-3 bg-[#101622] rounded-lg border border-[#324467]">
                                            <div className={`w-10 h-10 rounded flex items-center justify-center ${doc.type === 'pdf' ? 'bg-red-900/20 text-red-400' : 'bg-blue-900/20 text-blue-400'}`}>
                                                {doc.type === 'pdf' ? '📄' : '🖼️'}
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className="text-white text-sm font-medium">{doc.name}</p>
                                                <p className="text-[#92a4c9] text-xs">{doc.size}</p>
                                            </div>
                                            <button className="text-[#1152d4] text-sm font-medium hover:text-blue-400">View</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button className="flex-1 py-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 font-bold hover:bg-red-900/30">Reject</button>
                                    <button className="flex-1 py-3 bg-[#1152d4] rounded-lg text-white font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-600">Approve Agency</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
