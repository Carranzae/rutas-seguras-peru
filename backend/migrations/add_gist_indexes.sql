-- ============================================
-- Ruta Segura Perú - GIST Index Migration
-- Performance optimization for geospatial queries
-- Aligned with actual table structure (PostGIS Geometry)
-- ============================================

-- 1. Create GIST index on tracking_points.location (PostGIS Geometry column)
-- This dramatically improves ST_DWithin and ST_Distance performance
CREATE INDEX IF NOT EXISTS idx_tracking_points_location_gist 
ON tracking_points 
USING GIST (location);

-- 2. Create composite index for user + time range queries
CREATE INDEX IF NOT EXISTS idx_tracking_points_user_created
ON tracking_points (user_id, created_at DESC);

-- 3. Create GIST index on emergencies.location (PostGIS Geometry column)
CREATE INDEX IF NOT EXISTS idx_emergencies_location_gist
ON emergencies
USING GIST (location);

-- 4. Create index for active emergencies filter
-- Using actual enum values from EmergencyStatus
CREATE INDEX IF NOT EXISTS idx_emergencies_status_active
ON emergencies (status)
WHERE status IN ('active', 'responding', 'escalated');

-- 5. Create index for emergency trigger lookup
CREATE INDEX IF NOT EXISTS idx_emergencies_triggered_by
ON emergencies (triggered_by_id, created_at DESC);

-- 6. Analyze tables after index creation
ANALYZE tracking_points;
ANALYZE emergencies;

-- ============================================
-- Verification queries
-- ============================================

-- Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('tracking_points', 'emergencies')
AND indexname LIKE 'idx_%';

-- Test query plan for spatial query on tracking_points
-- This should show "Index Scan using idx_tracking_points_location_gist"
EXPLAIN ANALYZE
SELECT id, user_id, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
FROM tracking_points
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(-77.0428, -12.0464), 4326)::geography,
    5000  -- 5km radius
)
LIMIT 10;
