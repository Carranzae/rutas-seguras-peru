'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PasswordRecovery() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-[#101622] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#1152d4]/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold mb-2">Password Recovery</h1>
                    <p className="text-[#92a4c9] text-sm">Enter your email to receive a recovery link</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[#92a4c9] text-sm block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@rutasegura.pe"
                                className="w-full h-14 bg-[#192233] border border-[#324467] rounded-xl px-4 text-white placeholder:text-[#92a4c9] outline-none focus:border-[#1152d4]"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full h-14 bg-[#1152d4] hover:bg-blue-600 rounded-xl text-white font-bold transition-colors">
                            Send Recovery Link
                        </button>
                        <Link href="/" className="block text-center text-[#1152d4] text-sm hover:underline">
                            Back to Login
                        </Link>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">✉️</span>
                        </div>
                        <h2 className="text-white text-xl font-bold mb-2">Check Your Email</h2>
                        <p className="text-[#92a4c9] text-sm mb-6">
                            We've sent a recovery link to <span className="text-white font-medium">{email}</span>
                        </p>
                        <Link href="/" className="inline-block px-6 py-3 bg-[#192233] border border-[#324467] rounded-xl text-white hover:bg-white/5 transition-colors">
                            Return to Login
                        </Link>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-[#92a4c9] text-xs">🔒 Secured by 256-bit encryption</p>
                </div>
            </div>
        </div>
    );
}
