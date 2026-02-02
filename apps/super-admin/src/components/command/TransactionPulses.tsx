'use client';

import { useEffect, useRef, useState } from 'react';

interface Transaction {
    id: string;
    amount: number;
    agency: string;
    tour: string;
    timestamp: Date;
    origin: { x: number; y: number };
    target: { x: number; y: number };
    progress: number;
}

export default function TransactionPulses() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalToday, setTotalToday] = useState(45890);

    useEffect(() => {
        // Generate initial transactions
        const generateTransaction = (): Transaction => ({
            id: Math.random().toString(36).substring(7),
            amount: Math.floor(Math.random() * 500) + 50,
            agency: ['Peru Adventure', 'Cusco Magic', 'Inca Trail Pro', 'Sacred Valley Tours'][Math.floor(Math.random() * 4)],
            tour: ['Machu Picchu', 'Rainbow Mountain', 'Sacred Valley', 'City Tour'][Math.floor(Math.random() * 4)],
            timestamp: new Date(),
            origin: { x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 },
            target: { x: 50, y: 90 },
            progress: 0,
        });

        // Add new transaction every 3 seconds
        const interval = setInterval(() => {
            const newTx = generateTransaction();
            setTransactions(prev => [...prev, newTx]);
            setTotalToday(prev => prev + newTx.amount);
        }, 3000);

        // Animate existing transactions
        const animationInterval = setInterval(() => {
            setTransactions(prev =>
                prev
                    .map(tx => ({
                        ...tx,
                        progress: Math.min(tx.progress + 5, 100),
                    }))
                    .filter(tx => tx.progress < 100)
            );
        }, 100);

        return () => {
            clearInterval(interval);
            clearInterval(animationInterval);
        };
    }, []);

    return (
        <div ref={containerRef} className="glass-panel p-4 relative overflow-hidden" style={{ minHeight: '200px' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <h3 className="font-telemetry text-[#00f2ff]">TRANSACTION FLOW</h3>
                </div>
                <span className="font-telemetry text-xs text-[#10b981]">● IZIPAY CONNECTED</span>
            </div>

            {/* Visualization Area */}
            <div className="relative h-40">
                {/* Central Collection Point */}
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center animate-pulse">
                            <span className="text-lg">💰</span>
                        </div>
                        <div className="absolute inset-0 w-16 h-16 -m-2 border-2 border-[#10b981] rounded-full animate-ping opacity-30" />
                    </div>
                </div>

                {/* Transaction Pulses */}
                <svg className="absolute inset-0" width="100%" height="100%">
                    {transactions.map((tx) => {
                        const currentX = tx.origin.x + (tx.target.x - tx.origin.x) * (tx.progress / 100);
                        const currentY = tx.origin.y + (tx.target.y - tx.origin.y) * (tx.progress / 100);

                        return (
                            <g key={tx.id}>
                                {/* Trail */}
                                <line
                                    x1={`${tx.origin.x}%`}
                                    y1={`${tx.origin.y}%`}
                                    x2={`${currentX}%`}
                                    y2={`${currentY}%`}
                                    stroke="#10b981"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                    opacity={0.5}
                                />
                                {/* Pulse Point */}
                                <circle
                                    cx={`${currentX}%`}
                                    cy={`${currentY}%`}
                                    r="6"
                                    fill="#10b981"
                                    opacity={1 - tx.progress / 200}
                                >
                                    <animate
                                        attributeName="r"
                                        values="4;8;4"
                                        dur="0.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                        );
                    })}
                </svg>

                {/* Origin Points (Agencies) */}
                {transactions.slice(-3).map((tx) => (
                    <div
                        key={`origin-${tx.id}`}
                        className="absolute text-xs font-telemetry text-[#64748b]"
                        style={{ left: `${tx.origin.x}%`, top: `${tx.origin.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="w-2 h-2 bg-[#00f2ff] rounded-full mb-1" />
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1e293b]">
                <div className="text-center">
                    <p className="font-telemetry text-xs text-[#64748b]">TODAY'S REVENUE</p>
                    <p className="font-telemetry text-xl text-glow-green">S/ {totalToday.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="font-telemetry text-xs text-[#64748b]">TRANSACTIONS</p>
                    <p className="font-telemetry text-xl text-[#00f2ff]">{transactions.length + 127}</p>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="mt-4 pt-4 border-t border-[#1e293b]">
                <p className="font-telemetry text-xs text-[#64748b] mb-2">RECENT</p>
                <div className="space-y-1">
                    {transactions.slice(-3).reverse().map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">{tx.agency}</span>
                            <span className="font-telemetry text-[#10b981]">+S/ {tx.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
