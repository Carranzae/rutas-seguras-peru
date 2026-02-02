'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AgencyRegistration() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        ruc: '',
        businessName: '',
        address: '',
        certificate: null as File | null,
    });

    const handleSubmit = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Submit registration
            alert('Agency registration submitted for review!');
        }
    };

    return (
        <div className="min-h-screen bg-[#101622] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#192233] rounded-2xl border border-[#324467] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#324467] flex items-center gap-4">
                    <Link href="/agencies/manage" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">←</Link>
                    <h2 className="text-white font-bold text-lg">Agency Registration</h2>
                </div>

                {/* Progress */}
                <div className="px-6 py-4 flex items-center justify-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-[#1152d4] shadow-[0_0_8px_rgba(17,82,212,0.5)]' : s < step ? 'w-2 bg-[#1152d4]' : 'w-2 bg-[#324467]'}`} />
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 pb-24">
                    {step === 1 && (
                        <>
                            <h3 className="text-white text-2xl font-bold mb-2">Register New Agency</h3>
                            <p className="text-[#92a4c9] text-sm mb-6">Enter your legal business details to manage your fleet and guides.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Tax ID (RUC)</label>
                                    <input
                                        type="text"
                                        placeholder="1234567890001"
                                        value={formData.ruc}
                                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                        className="w-full bg-[#101622] border border-[#324467] rounded-lg px-4 py-3 text-white placeholder:text-[#92a4c9] outline-none focus:border-[#1152d4]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Legal Business Name</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#92a4c9]">🏢</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. Peru Tours S.A."
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            className="w-full bg-[#101622] border border-[#324467] rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-[#92a4c9] outline-none focus:border-[#1152d4]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h3 className="text-white text-2xl font-bold mb-2">Upload Documents</h3>
                            <p className="text-[#92a4c9] text-sm mb-6">Provide your operating certificate and business license.</p>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-white">Operating Certificate</label>
                                        <span className="text-[#92a4c9] text-xs cursor-help" title="Valid Tourism Operator Certificate is required">❓</span>
                                    </div>
                                    <button className="w-full border-2 border-dashed border-[#324467] rounded-xl p-8 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-[#1152d4]/20 flex items-center justify-center text-[#1152d4] text-xl">📤</div>
                                        <p className="text-white text-sm font-medium">Tap to upload Certificate</p>
                                        <p className="text-[#92a4c9] text-xs">Supports .pdf, .jpg (Max 5MB)</p>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Headquarters Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-[#92a4c9]">📍</span>
                                        <textarea
                                            placeholder="Enter full street address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-[#101622] border border-[#324467] rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-[#92a4c9] outline-none focus:border-[#1152d4] resize-none h-20"
                                        />
                                    </div>
                                </div>

                                {/* Map preview */}
                                <div className="h-32 rounded-lg bg-[#101622] border border-[#324467] relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button className="flex items-center gap-2 bg-[#192233]/90 px-4 py-2 rounded-full text-white text-xs font-medium border border-white/10">
                                            📍 Pin on Map
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h3 className="text-white text-2xl font-bold mb-2">Review & Submit</h3>
                            <p className="text-[#92a4c9] text-sm mb-6">Verify your information before submitting for approval.</p>

                            <div className="space-y-4">
                                <div className="bg-[#101622] rounded-lg p-4 border border-[#324467]">
                                    <p className="text-[#92a4c9] text-xs uppercase tracking-wider mb-1">Tax ID</p>
                                    <p className="text-white font-medium">{formData.ruc || 'Not provided'}</p>
                                </div>

                                <div className="bg-[#101622] rounded-lg p-4 border border-[#324467]">
                                    <p className="text-[#92a4c9] text-xs uppercase tracking-wider mb-1">Business Name</p>
                                    <p className="text-white font-medium">{formData.businessName || 'Not provided'}</p>
                                </div>

                                <div className="bg-[#101622] rounded-lg p-4 border border-[#324467]">
                                    <p className="text-[#92a4c9] text-xs uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-white font-medium">{formData.address || 'Not provided'}</p>
                                </div>

                                <div className="bg-[#1152d4]/10 rounded-lg p-4 border border-[#1152d4]/30">
                                    <p className="text-[#1152d4] text-sm">⏳ After submission, your application will be reviewed within 24-48 hours. You will receive an email notification when approved.</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#101622] via-[#101622] to-transparent flex justify-center">
                    <div className="w-full max-w-md">
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-[#1152d4] hover:bg-blue-600 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                        >
                            <span>{step === 3 ? 'Verify & Register' : 'Continue'}</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
