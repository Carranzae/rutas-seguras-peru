"""
Ruta Segura Perú - Geospatial Utilities
Helper functions for PostGIS operations
"""
from typing import Tuple
from shapely.geometry import Point, LineString
from geoalchemy2.shape import from_shape, to_shape
from geoalchemy2.elements import WKBElement


def create_point(longitude: float, latitude: float) -> str:
    """Create a PostGIS Point from coordinates."""
    point = Point(longitude, latitude)
    return from_shape(point, srid=4326)


def create_linestring(coordinates: list[Tuple[float, float]]) -> str:
    """Create a PostGIS LineString from coordinate pairs."""
    line = LineString(coordinates)
    return from_shape(line, srid=4326)


def extract_coordinates(geom: WKBElement) -> Tuple[float, float]:
    """Extract longitude, latitude from a PostGIS Point."""
    shape = to_shape(geom)
    return (shape.x, shape.y)


def extract_linestring_coords(geom: WKBElement) -> list[Tuple[float, float]]:
    """Extract coordinate list from a PostGIS LineString."""
    shape = to_shape(geom)
    return list(shape.coords)


def calculate_distance_km(
    point1: Tuple[float, float],
    point2: Tuple[float, float],
) -> float:
    """
    Calculate approximate distance between two points in kilometers.
    Uses Haversine formula.
    """
    from math import radians, sin, cos, sqrt, atan2
    
    lon1, lat1 = point1
    lon2, lat2 = point2
    
    R = 6371  # Earth radius in km
    
    lat1, lat2, lon1, lon2 = map(radians, [lat1, lat2, lon1, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c
