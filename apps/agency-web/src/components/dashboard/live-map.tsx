"use client"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect, useState } from "react"
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet"

// Fix for Leaflet default marker icons
const guideIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const sosIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// Mock guide locations
const mockGuides = [
    { id: 1, name: "Carlos Mendoza", lat: -13.5319, lng: -71.9675, tour: "Cusco City Tour", tourists: 8 },
    { id: 2, name: "Ana Torres", lat: -13.1631, lng: -72.5450, tour: "Machu Picchu", tourists: 12 },
    { id: 3, name: "Luis Vargas", lat: -15.8402, lng: -70.0219, tour: "Lake Titicaca", tourists: 6 },
    { id: 4, name: "María López", lat: -13.5183, lng: -71.9781, tour: "Sacred Valley", tourists: 10 },
]

// Mock SOS alert
const mockSOS = {
    id: "sos-1",
    lat: -13.1631,
    lng: -72.5450,
    tourist: "María García",
    guide: "Ana Torres",
    time: "14:32",
}

export default function LiveMap() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return (
            <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Cargando mapa...</span>
            </div>
        )
    }

    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden border">
            <MapContainer
                center={[-13.5319, -71.9675]}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Guide markers */}
                {mockGuides.map((guide) => (
                    <Marker key={guide.id} position={[guide.lat, guide.lng]} icon={guideIcon}>
                        <Popup>
                            <div className="text-sm">
                                <p className="font-bold text-blue-600">{guide.name}</p>
                                <p className="text-gray-600">{guide.tour}</p>
                                <p className="text-gray-500">{guide.tourists} turistas</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* SOS Alert marker */}
                {mockSOS && (
                    <>
                        <Marker position={[mockSOS.lat, mockSOS.lng]} icon={sosIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold text-red-600">🚨 ALERTA SOS</p>
                                    <p>Turista: {mockSOS.tourist}</p>
                                    <p>Guía: {mockSOS.guide}</p>
                                    <p className="text-gray-500">Activado: {mockSOS.time}</p>
                                </div>
                            </Popup>
                        </Marker>
                        <Circle
                            center={[mockSOS.lat, mockSOS.lng]}
                            radius={5000}
                            pathOptions={{
                                color: "red",
                                fillColor: "red",
                                fillOpacity: 0.1,
                            }}
                        />
                    </>
                )}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
                <p className="text-xs font-semibold mb-2">Leyenda</p>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Guía activo</span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Alerta SOS</span>
                </div>
            </div>
        </div>
    )
}
