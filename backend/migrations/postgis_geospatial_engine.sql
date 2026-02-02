-- ============================================
-- RUTA SEGURA - POSTGIS GEOSPATIAL OPTIMIZATIONS
-- Real-time tracking with Uber-style matching
-- ============================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================
-- 1. ACTIVE TRACKING TABLE (Live positions in RAM via Redis fallback)
-- ============================================
CREATE TABLE IF NOT EXISTS active_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('guide', 'tourist', 'agency_admin')),
    
    -- PostGIS Geography for accurate distance calculations on Earth's surface
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- GPS Metadata
    altitude FLOAT,
    speed FLOAT,  -- km/h
    heading FLOAT,  -- degrees 0-360
    accuracy FLOAT,  -- meters
    
    -- Device status
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INT,  -- dBm
    
    -- Tour context
    tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'sos', 'offline', 'low_battery')),
    is_emergency BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint - one position per user
    CONSTRAINT unique_user_tracking UNIQUE (user_id)
);

-- ============================================
-- 2. GIST INDEXES FOR SPATIAL QUERIES
-- ============================================

-- Main spatial index on active_tracking
CREATE INDEX IF NOT EXISTS idx_active_tracking_location_gist 
ON active_tracking USING GIST (location);

-- Index on tracking_points for historical queries
CREATE INDEX IF NOT EXISTS idx_tracking_points_location_gist 
ON tracking_points USING GIST (location);

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_active_tracking_tour 
ON active_tracking (tour_id) WHERE tour_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_active_tracking_agency 
ON active_tracking (agency_id) WHERE agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_active_tracking_emergency 
ON active_tracking (is_emergency) WHERE is_emergency = TRUE;

CREATE INDEX IF NOT EXISTS idx_active_tracking_status 
ON active_tracking (status);

-- ============================================
-- 3. UBER-STYLE: FIND GUIDES WITHIN RADIUS
-- ============================================
CREATE OR REPLACE FUNCTION find_guides_within_radius(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    guide_id UUID,
    guide_name TEXT,
    distance_meters DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    battery_level INT,
    status VARCHAR,
    tour_id UUID,
    agency_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.user_id AS guide_id,
        u.full_name AS guide_name,
        ST_Distance(
            at.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) AS distance_meters,
        ST_Y(at.location::geometry) AS latitude,
        ST_X(at.location::geometry) AS longitude,
        at.battery_level,
        at.status,
        at.tour_id,
        a.name AS agency_name
    FROM active_tracking at
    JOIN users u ON at.user_id = u.id
    LEFT JOIN agencies a ON at.agency_id = a.id
    WHERE 
        at.user_type = 'guide'
        AND at.status != 'offline'
        AND ST_DWithin(
            at.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_km * 1000  -- Convert km to meters
        )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FIND TOURISTS NEAR A GUIDE (for rescue scenarios)
-- ============================================
CREATE OR REPLACE FUNCTION find_tourists_near_guide(
    p_guide_id UUID,
    p_radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
    tourist_id UUID,
    tourist_name TEXT,
    distance_meters DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    battery_level INT,
    status VARCHAR,
    is_emergency BOOLEAN
) AS $$
DECLARE
    guide_location GEOGRAPHY;
BEGIN
    -- Get guide's current location
    SELECT location INTO guide_location
    FROM active_tracking
    WHERE user_id = p_guide_id AND user_type = 'guide';
    
    IF guide_location IS NULL THEN
        RETURN;  -- Guide not found
    END IF;
    
    RETURN QUERY
    SELECT 
        at.user_id AS tourist_id,
        u.full_name AS tourist_name,
        ST_Distance(at.location, guide_location) AS distance_meters,
        ST_Y(at.location::geometry) AS latitude,
        ST_X(at.location::geometry) AS longitude,
        at.battery_level,
        at.status,
        at.is_emergency
    FROM active_tracking at
    JOIN users u ON at.user_id = u.id
    WHERE 
        at.user_type = 'tourist'
        AND ST_DWithin(at.location, guide_location, p_radius_km * 1000)
    ORDER BY 
        at.is_emergency DESC,  -- Emergencies first
        distance_meters ASC
    ;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CALCULATE TRAJECTORY PREDICTION
-- ============================================
CREATE OR REPLACE FUNCTION predict_trajectory(
    p_user_id UUID,
    p_minutes_ahead INT DEFAULT 5
)
RETURNS TABLE (
    predicted_latitude DOUBLE PRECISION,
    predicted_longitude DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    based_on_points INT
) AS $$
DECLARE
    avg_speed DOUBLE PRECISION;
    avg_heading DOUBLE PRECISION;
    last_lat DOUBLE PRECISION;
    last_lng DOUBLE PRECISION;
    point_count INT;
    distance_to_move DOUBLE PRECISION;
BEGIN
    -- Get last 5 points to calculate trajectory
    SELECT 
        AVG(speed),
        AVG(heading),
        COUNT(*)
    INTO avg_speed, avg_heading, point_count
    FROM (
        SELECT speed, heading
        FROM tracking_points
        WHERE user_id = p_user_id
          AND recorded_at > NOW() - INTERVAL '10 minutes'
          AND speed IS NOT NULL
          AND heading IS NOT NULL
        ORDER BY recorded_at DESC
        LIMIT 5
    ) recent;
    
    -- Get current position
    SELECT 
        ST_Y(location::geometry),
        ST_X(location::geometry)
    INTO last_lat, last_lng
    FROM active_tracking
    WHERE user_id = p_user_id;
    
    IF last_lat IS NULL OR avg_speed IS NULL OR avg_heading IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate predicted position
    -- distance = speed (km/h) * time (hours)
    distance_to_move := avg_speed * (p_minutes_ahead / 60.0);  -- in km
    
    -- Simple projection using heading
    -- This is an approximation; for production use a proper geodesic calculation
    predicted_latitude := last_lat + (distance_to_move / 111.32) * COS(RADIANS(avg_heading));
    predicted_longitude := last_lng + (distance_to_move / (111.32 * COS(RADIANS(last_lat)))) * SIN(RADIANS(avg_heading));
    confidence := LEAST(point_count::DOUBLE PRECISION / 5.0, 1.0);
    based_on_points := point_count;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. UPSERT LOCATION (for real-time updates)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_active_location(
    p_user_id UUID,
    p_user_type VARCHAR,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_altitude DOUBLE PRECISION DEFAULT NULL,
    p_speed DOUBLE PRECISION DEFAULT NULL,
    p_heading DOUBLE PRECISION DEFAULT NULL,
    p_accuracy DOUBLE PRECISION DEFAULT NULL,
    p_battery INT DEFAULT NULL,
    p_tour_id UUID DEFAULT NULL,
    p_agency_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO active_tracking (
        user_id, user_type, location, altitude, speed, heading, 
        accuracy, battery_level, tour_id, agency_id, recorded_at
    )
    VALUES (
        p_user_id, 
        p_user_type,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        p_altitude, p_speed, p_heading, p_accuracy, p_battery,
        p_tour_id, p_agency_id, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        altitude = COALESCE(p_altitude, active_tracking.altitude),
        speed = COALESCE(p_speed, active_tracking.speed),
        heading = COALESCE(p_heading, active_tracking.heading),
        accuracy = COALESCE(p_accuracy, active_tracking.accuracy),
        battery_level = COALESCE(p_battery, active_tracking.battery_level),
        tour_id = COALESCE(p_tour_id, active_tracking.tour_id),
        agency_id = COALESCE(p_agency_id, active_tracking.agency_id),
        recorded_at = NOW(),
        status = CASE 
            WHEN p_battery IS NOT NULL AND p_battery < 10 THEN 'low_battery'
            WHEN p_speed IS NOT NULL AND p_speed > 0.5 THEN 'active'
            ELSE 'idle'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CLEANUP OLD OFFLINE USERS
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_stale_tracking()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Mark users as offline if no update in 5 minutes
    UPDATE active_tracking
    SET status = 'offline'
    WHERE recorded_at < NOW() - INTERVAL '5 minutes'
      AND status != 'offline';
    
    -- Delete entries older than 1 hour
    DELETE FROM active_tracking
    WHERE recorded_at < NOW() - INTERVAL '1 hour'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. GET ALL ACTIVE USERS FOR MAP
-- ============================================
CREATE OR REPLACE VIEW v_active_map_users AS
SELECT 
    at.user_id,
    at.user_type,
    u.full_name AS user_name,
    ST_Y(at.location::geometry) AS latitude,
    ST_X(at.location::geometry) AS longitude,
    at.altitude,
    at.speed,
    at.heading,
    at.battery_level,
    at.status,
    at.is_emergency,
    at.tour_id,
    t.name AS tour_name,
    at.agency_id,
    a.name AS agency_name,
    EXTRACT(EPOCH FROM (NOW() - at.recorded_at)) AS seconds_since_update
FROM active_tracking at
JOIN users u ON at.user_id = u.id
LEFT JOIN tours t ON at.tour_id = t.id
LEFT JOIN agencies a ON at.agency_id = a.id
WHERE at.status != 'offline'
ORDER BY at.is_emergency DESC, at.recorded_at DESC;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE active_tracking IS 'Real-time user locations for live tracking. One row per active user.';
COMMENT ON FUNCTION find_guides_within_radius IS 'Uber-style guide matching within specified radius in kilometers.';
COMMENT ON FUNCTION predict_trajectory IS 'AI-style trajectory prediction based on recent movement history.';
