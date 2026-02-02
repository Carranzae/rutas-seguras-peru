'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface TourForm {
    name: string;
    description: string;
    price: number;
    currency: string;
    duration_hours: number;
    max_participants: number;
    difficulty_level: string;
    meeting_point: string;
    included_services: string[];
    images: File[];
}

export default function NewTourPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<TourForm>({
        name: '',
        description: '',
        price: 0,
        currency: 'PEN',
        duration_hours: 4,
        max_participants: 10,
        difficulty_level: 'moderate',
        meeting_point: '',
        included_services: [],
        images: [],
    });
    const [newService, setNewService] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('superadmin_token');

            // Create tour first
            const tourData = {
                name: form.name,
                description: form.description,
                price: form.price,
                currency: form.currency,
                duration_hours: form.duration_hours,
                max_participants: form.max_participants,
                difficulty_level: form.difficulty_level,
                meeting_point: form.meeting_point,
                included_services: form.included_services,
            };

            const response = await fetch('/api/v1/tours', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tourData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error creating tour');
            }

            const createdTour = await response.json();

            // Upload cover image (first image)
            if (form.images.length > 0) {
                // Upload first image as cover
                const coverFormData = new FormData();
                coverFormData.append('file', form.images[0]);
                coverFormData.append('category', 'tour_cover');

                const coverResponse = await fetch(`/api/v1/uploads/tour/${createdTour.id}/cover`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: coverFormData,
                });

                if (!coverResponse.ok) {
                    console.warn('Cover upload failed, continuing...');
                }

                // Upload remaining images as gallery
                if (form.images.length > 1) {
                    const galleryFormData = new FormData();
                    for (let i = 1; i < form.images.length; i++) {
                        galleryFormData.append('files', form.images[i]);
                    }

                    const galleryResponse = await fetch(`/api/v1/uploads/tour/${createdTour.id}/gallery`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        body: galleryFormData,
                    });

                    if (!galleryResponse.ok) {
                        console.warn('Gallery upload failed, continuing...');
                    }
                }
            }

            toast.success('Tour creado exitosamente', {
                description: 'El tour ha sido añadido al marketplace.',
            });

            router.push('/tours');
        } catch (error: any) {
            console.error('Error creating tour:', error);
            toast.error('Error al crear tour', {
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const addService = () => {
        if (newService.trim()) {
            setForm(prev => ({
                ...prev,
                included_services: [...prev.included_services, newService.trim()],
            }));
            setNewService('');
        }
    };

    const removeService = (index: number) => {
        setForm(prev => ({
            ...prev,
            included_services: prev.included_services.filter((_, i) => i !== index),
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files);
            setForm(prev => ({
                ...prev,
                images: [...prev.images, ...newImages],
            }));

            // Create preview URLs
            newImages.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
                >
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-white">Crear Nuevo Tour</h1>
                <p className="text-gray-400">Completa los detalles para añadir un tour al marketplace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h2 className="text-lg font-semibold text-cyan-400 mb-4">📝 Información Básica</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Nombre del Tour *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="Ej: Machu Picchu al Amanecer"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Descripción *</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none h-32 resize-none"
                                placeholder="Describe la experiencia que vivirán los turistas..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Precio *</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                                    className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="PEN">PEN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Duración (horas) *</label>
                            <input
                                type="number"
                                value={form.duration_hours}
                                onChange={(e) => setForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                min="1"
                                max="72"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Participantes Máx.</label>
                            <input
                                type="number"
                                value={form.max_participants}
                                onChange={(e) => setForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                min="1"
                                max="100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Dificultad</label>
                            <select
                                value={form.difficulty_level}
                                onChange={(e) => setForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="easy">Fácil</option>
                                <option value="moderate">Moderado</option>
                                <option value="challenging">Desafiante</option>
                                <option value="extreme">Extremo</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Punto de Encuentro</label>
                            <input
                                type="text"
                                value={form.meeting_point}
                                onChange={(e) => setForm(prev => ({ ...prev, meeting_point: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="Ej: Plaza de Armas, Cusco"
                            />
                        </div>
                    </div>
                </div>

                {/* Services Included */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h2 className="text-lg font-semibold text-cyan-400 mb-4">✅ Servicios Incluidos</h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                            placeholder="Ej: Transporte incluido"
                        />
                        <button
                            type="button"
                            onClick={addService}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                        >
                            Añadir
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {form.included_services.map((service, index) => (
                            <span
                                key={index}
                                className="bg-slate-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {service}
                                <button
                                    type="button"
                                    onClick={() => removeService(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {form.included_services.length === 0 && (
                            <p className="text-gray-500 text-sm italic">No hay servicios añadidos</p>
                        )}
                    </div>
                </div>

                {/* Images */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h2 className="text-lg font-semibold text-cyan-400 mb-4">📷 Imágenes del Tour</h2>

                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="text-4xl mb-2">📤</div>
                            <p className="text-gray-400">Arrastra imágenes aquí o haz clic para seleccionar</p>
                            <p className="text-gray-500 text-sm mt-1">PNG, JPG, WEBP (máx. 5MB cada una)</p>
                        </label>
                    </div>

                    {previewImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {previewImages.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                Creando...
                            </>
                        ) : (
                            <>
                                🚀 Crear Tour
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
