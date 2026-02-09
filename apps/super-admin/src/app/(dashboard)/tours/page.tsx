"use client";

import { api } from "@/services/api";
import { CreateTourData, Tour, toursService } from "@/services/tours.service";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const UploadIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CATEGORIES = ["adventure", "culture", "nature", "gastronomy", "wellness"];
const DIFFICULTIES = ["easy", "moderate", "challenging", "extreme"];

export default function ToursPage() {
    const router = useRouter();
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTour, setEditingTour] = useState<Tour | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<CreateTourData>({
        name: "",
        description: "",
        price: 0,
        duration_hours: 4,
        max_capacity: 15,
        difficulty: "moderate",
        category: "adventure",
        start_location: "",
        cover_image_url: "",
        gallery_urls: [],
        video_url: "",
        is_featured: false,
    });
    const [galleryInput, setGalleryInput] = useState("");

    const loadTours = useCallback(async () => {
        setLoading(true);
        try {
            const data = await toursService.getAll();
            setTours(data);
        } catch (error) {
            console.error("Failed to load tours:", error);
            toast.error("Error al cargar tours");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTours();
    }, [loadTours]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'video' | 'gallery') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading("Subiendo archivo...");

        try {
            // Determine category for upload
            let category = 'tour';
            if (field === 'cover') category = 'tour_cover';
            if (field === 'gallery') category = 'tour_gallery';

            const { url } = await api.uploadFile(file, category);

            if (field === 'gallery') {
                setFormData(prev => ({
                    ...prev,
                    gallery_urls: [...(prev.gallery_urls || []), url]
                }));
            } else if (field === 'cover') {
                setFormData(prev => ({ ...prev, cover_image_url: url }));
            } else if (field === 'video') {
                setFormData(prev => ({ ...prev, video_url: url }));
            }

            toast.success("Archivo subido correctamente", { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Error al subir archivo", { id: toastId });
        } finally {
            setUploading(false);
            // Reset input value to allow uploading same file again
            e.target.value = '';
        }
    };

    const openCreateModal = () => {
        setEditingTour(null);
        setFormData({
            name: "",
            description: "",
            price: 0,
            duration_hours: 4,
            max_capacity: 15,
            difficulty: "moderate",
            category: "adventure",
            start_location: "",
            cover_image_url: "",
            gallery_urls: [],
            video_url: "",
            is_featured: false,
        });
        setGalleryInput("");
        setShowModal(true);
    };

    const openEditModal = (tour: Tour) => {
        setEditingTour(tour);
        setFormData({
            name: tour.name,
            description: tour.description,
            price: tour.price,
            duration_hours: tour.duration_hours,
            max_capacity: tour.max_capacity,
            difficulty: tour.difficulty,
            category: tour.category,
            start_location: tour.location,
            cover_image_url: tour.cover_image_url || tour.image_url || "",
            gallery_urls: tour.gallery_urls || [],
            video_url: tour.video_url || "",
            is_featured: tour.is_featured || false,
        });
        setGalleryInput("");
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este tour?")) return;
        try {
            await toursService.delete(id);
            toast.success("Tour eliminado");
            loadTours();
        } catch (error) {
            console.error("Failed to delete tour:", error);
            toast.error("Error al eliminar tour");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTour) {
                await toursService.update(editingTour.id, formData);
                toast.success("Tour actualizado");
            } else {
                await toursService.create(formData);
                toast.success("Tour creado");
            }
            setShowModal(false);
            loadTours();
        } catch (error) {
            console.error("Failed to save tour:", error);
            toast.error("Error al guardar tour");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published":
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "draft":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "in_progress":
                return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
            default:
                return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Marketplace CMS</h1>
                    <p className="text-slate-400 mt-1">Gestiona los tours y experiencias</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                    <PlusIcon />
                    Nuevo Tour
                </button>
            </div>

            {/* Tours Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                        <div
                            key={tour.id}
                            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all group"
                        >
                            {/* Tour Image */}
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                                {(tour.cover_image_url || tour.image_url) ? (
                                    <img
                                        src={tour.cover_image_url || tour.image_url}
                                        alt={tour.name}
                                        className="w-full h-full object-cover"
                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <span className={`text-4xl ${(tour.cover_image_url || tour.image_url) ? 'hidden' : ''}`}>🏔️</span>
                                {tour.is_featured && (
                                    <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">⭐ DESTACADO</span>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                        {tour.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(tour.status)}`}
                                    >
                                        {tour.status}
                                    </span>
                                </div>

                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                    {tour.description}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
                                    <span className="flex items-center gap-1">
                                        💰 S/. {tour.price}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        ⏱️ {tour.duration_hours}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                        👥 {tour.current_bookings}/{tour.max_capacity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">
                                        {tour.category}
                                    </span>
                                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">
                                        {tour.difficulty}
                                    </span>
                                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">
                                        📍 {tour.location}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={() => openEditModal(tour)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    >
                                        <EditIcon /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tour.id)}
                                        className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {tours.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                            <span className="text-6xl mb-4">🏜️</span>
                            <p className="text-lg">No hay tours creados</p>
                            <p className="text-sm">Crea tu primer tour para comenzar</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-2xl font-bold text-white">
                                {editingTour ? "Editar Tour" : "Nuevo Tour"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre del Tour *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                    placeholder="Ej: Machu Picchu Sunrise"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Descripción *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                                    placeholder="Describe la experiencia..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Precio (S/.)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Duración (horas)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.duration_hours}
                                        onChange={(e) => setFormData({ ...formData, duration_hours: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Dificultad
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                    >
                                        {DIFFICULTIES.map((diff) => (
                                            <option key={diff} value={diff}>
                                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Capacidad Máxima
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.max_capacity}
                                        onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Ubicación
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.start_location}
                                        onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                        placeholder="Ej: Cusco"
                                    />
                                </div>
                            </div>

                            {/* MEDIA SECTION */}
                            <div className="border-t border-slate-700 pt-5 mt-5">
                                <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                                    📸 Media del Tour
                                </h3>
                                <p className="text-xs text-slate-400 mb-4">
                                    Sube archivos desde tu dispositivo o usa enlaces directos
                                </p>

                                {/* Cover Image */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Imagen de Portada
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="url"
                                            value={formData.cover_image_url || ""}
                                            onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                            placeholder="https://..."
                                        />
                                        <label className={`cursor-pointer px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} disabled={uploading} />
                                            <UploadIcon />
                                        </label>
                                    </div>
                                    {formData.cover_image_url && (
                                        <div className="mt-2 h-24 w-24 rounded-lg overflow-hidden border border-slate-700">
                                            <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Video URL */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Video Promocional
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={formData.video_url || ""}
                                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                            placeholder="https://..."
                                        />
                                        <label className={`cursor-pointer px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={uploading} />
                                            <UploadIcon />
                                        </label>
                                    </div>
                                </div>

                                {/* Gallery URLs */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Galería de Imágenes
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="url"
                                            value={galleryInput}
                                            onChange={(e) => setGalleryInput(e.target.value)}
                                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 outline-none transition-all"
                                            placeholder="https://..."
                                        />
                                        <label className={`cursor-pointer px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'gallery')} disabled={uploading} />
                                            <UploadIcon />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (galleryInput.trim()) {
                                                    setFormData({
                                                        ...formData,
                                                        gallery_urls: [...(formData.gallery_urls || []), galleryInput.trim()]
                                                    });
                                                    setGalleryInput("");
                                                }
                                            }}
                                            className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl transition-colors"
                                        >
                                            + URL
                                        </button>
                                    </div>
                                    {/* Gallery preview */}
                                    {(formData.gallery_urls?.length || 0) > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.gallery_urls?.map((url: string, index: number) => (
                                                <div key={index} className="relative group">
                                                    <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-700">
                                                        <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newGallery = formData.gallery_urls?.filter((_: string, i: number) => i !== index) || [];
                                                            setFormData({ ...formData, gallery_urls: newGallery });
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Featured Toggle */}
                                <div className="flex items-center gap-3 mt-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured || false}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                    </label>
                                    <span className="text-sm font-medium text-slate-300">⭐ Tour Destacado (aparece primero)</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                                >
                                    {editingTour ? "Guardar Cambios" : "Crear Tour"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
