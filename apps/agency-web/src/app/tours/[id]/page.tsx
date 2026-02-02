"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateTourData, toursService } from "@/lib/services"
import {
    ArrowLeft,
    Camera,
    Clock,
    DollarSign,
    Loader2,
    MapPin,
    Plus,
    Save,
    Trash2,
    Users,
    X
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const difficultyOptions = [
    { value: "easy", label: "Fácil", description: "Para todo público" },
    { value: "moderate", label: "Moderado", description: "Requiere condición física básica" },
    { value: "challenging", label: "Desafiante", description: "Requiere experiencia previa" },
    { value: "expert", label: "Experto", description: "Solo profesionales" },
]

export default function EditTourPage() {
    const params = useParams()
    const router = useRouter()
    const tourId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState<CreateTourData>({
        title: "",
        description: "",
        short_description: "",
        price: 0,
        duration_hours: 1,
        max_participants: 10,
        difficulty: "moderate",
        included: [""],
        not_included: [""],
        meeting_point: "",
        status: "draft",
    })

    const [existingCover, setExistingCover] = useState<string>("")
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string>("")
    const [existingGallery, setExistingGallery] = useState<string[]>([])
    const [galleryImages, setGalleryImages] = useState<File[]>([])
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

    // Load tour data
    useEffect(() => {
        async function loadTour() {
            try {
                const tour = await toursService.getById(tourId)
                setFormData({
                    title: tour.title,
                    description: tour.description,
                    short_description: tour.short_description || "",
                    price: tour.price,
                    duration_hours: tour.duration_hours,
                    max_participants: tour.max_participants,
                    difficulty: tour.difficulty,
                    included: tour.included.length > 0 ? tour.included : [""],
                    not_included: tour.not_included.length > 0 ? tour.not_included : [""],
                    meeting_point: tour.meeting_point,
                    status: tour.status,
                })
                if (tour.cover_image_url) {
                    setExistingCover(tour.cover_image_url)
                    setCoverPreview(tour.cover_image_url)
                }
                if (tour.gallery_urls) {
                    setExistingGallery(tour.gallery_urls)
                }
            } catch (err) {
                setError("Error al cargar el tour")
            } finally {
                setLoading(false)
            }
        }
        loadTour()
    }, [tourId])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === "price" || name === "duration_hours" || name === "max_participants"
                ? Number(value)
                : value
        }))
    }

    const handleArrayChange = (field: "included" | "not_included", index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }))
    }

    const addArrayItem = (field: "included" | "not_included") => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }))
    }

    const removeArrayItem = (field: "included" | "not_included", index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }))
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverImage(file)
            setCoverPreview(URL.createObjectURL(file))
            setExistingCover("")
        }
    }

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setGalleryImages(prev => [...prev, ...files])
        setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    }

    const removeGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index))
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingGalleryImage = (index: number) => {
        setExistingGallery(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent, publish = false) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            // Filter out empty items from arrays
            const cleanData = {
                ...formData,
                included: formData.included.filter(i => i.trim()),
                not_included: formData.not_included.filter(i => i.trim()),
                status: publish ? "published" : formData.status,
            }

            await toursService.update(tourId, cleanData)

            // Upload new images if any
            if (coverImage) {
                await toursService.uploadImage(tourId, coverImage, "cover")
            }

            for (const img of galleryImages) {
                await toursService.uploadImage(tourId, img, "gallery")
            }

            router.push("/tours")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar el tour")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este tour? Esta acción no se puede deshacer.")) return

        try {
            await toursService.delete(tourId)
            router.push("/tours")
        } catch (err) {
            setError("Error al eliminar el tour")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/tours">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Editar Tour</h1>
                        <p className="text-muted-foreground">{formData.title}</p>
                    </div>
                </div>
                <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 size={16} className="mr-2" /> Eliminar Tour
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nombre del Tour *</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Descripción Corta</label>
                            <input
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleChange}
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Descripción Completa *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Tour</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                                <DollarSign size={16} /> Precio (S/)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={0}
                                required
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Clock size={16} /> Duración (horas)
                            </label>
                            <input
                                type="number"
                                name="duration_hours"
                                value={formData.duration_hours}
                                onChange={handleChange}
                                min={1}
                                required
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Users size={16} /> Máx. Participantes
                            </label>
                            <input
                                type="number"
                                name="max_participants"
                                value={formData.max_participants}
                                onChange={handleChange}
                                min={1}
                                required
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Dificultad</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {difficultyOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <MapPin size={16} /> Punto de Encuentro
                            </label>
                            <input
                                name="meeting_point"
                                value={formData.meeting_point}
                                onChange={handleChange}
                                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Included / Not Included */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-green-600">✓ Incluye</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {formData.included.map((item, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={item}
                                        onChange={(e) => handleArrayChange("included", i, e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("included", i)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("included")}>
                                <Plus size={16} className="mr-1" /> Agregar
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">✗ No Incluye</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {formData.not_included.map((item, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={item}
                                        onChange={(e) => handleArrayChange("not_included", i, e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("not_included", i)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("not_included")}>
                                <Plus size={16} className="mr-1" /> Agregar
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Images */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera size={20} /> Imágenes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Cover Image */}
                        <div>
                            <label className="text-sm font-medium">Imagen de Portada</label>
                            <div className="mt-2">
                                {coverPreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={() => { setCoverImage(null); setCoverPreview(""); setExistingCover("") }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                        <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Click para subir portada</span>
                                        <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div>
                            <label className="text-sm font-medium">Galería de Fotos</label>
                            <div className="mt-2 grid grid-cols-4 gap-4">
                                {existingGallery.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden">
                                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 w-6 h-6"
                                            onClick={() => removeExistingGalleryImage(i)}
                                        >
                                            <X size={12} />
                                        </Button>
                                    </div>
                                ))}
                                {galleryPreviews.map((preview, i) => (
                                    <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden">
                                        <img src={preview} alt={`New ${i}`} className="w-full h-full object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 w-6 h-6"
                                            onClick={() => removeGalleryImage(i)}
                                        >
                                            <X size={12} />
                                        </Button>
                                    </div>
                                ))}
                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                    <input type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/tours">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" variant="outline" disabled={saving}>
                        <Save size={16} className="mr-2" />
                        Guardar Cambios
                    </Button>
                    {formData.status !== "published" && (
                        <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={saving}>
                            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                            Publicar Tour
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
