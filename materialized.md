# Building a Comprehensive Time-Series Data Solution with PostgreSQL Materialized Views

Here's how to implement a system that combines up-to-date detailed data with downsampled historical data using materialized views:

## Architecture Overview

1. **Live Data View**: Materialized view refreshed frequently covering recent data (e.g., last 24 hours)
2. **Downsampled Historical Views**: Multiple materialized views at different granularities (hourly, daily, monthly)
3. **Combined Query View**: Regular view that unions current and historical data seamlessly

## Implementation Steps

### 1. Base Tables Structure

Assuming you have data across multiple related tables, for example:

```sql
-- Example schema
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id),
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC,
    -- other columns
);

CREATE TABLE sensor_events (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id),
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(50),
    -- other columns
);
```

### 2. Recent Detailed Data View

```sql
CREATE MATERIALIZED VIEW mv_recent_metrics AS
SELECT 
    r.sensor_id,
    r.timestamp,
    r.value,
    e.event_type,
    -- Join other attributes as needed
    s.location,
    s.type AS sensor_type
FROM sensor_readings r
LEFT JOIN sensor_events e ON 
    r.sensor_id = e.sensor_id AND 
    e.timestamp BETWEEN r.timestamp - INTERVAL '1 minute' AND r.timestamp + INTERVAL '1 minute'
JOIN sensors s ON r.sensor_id = s.id
WHERE r.timestamp > (NOW() - INTERVAL '24 hours')
WITH DATA;

-- Create indexes for performance
CREATE INDEX idx_mv_recent_metrics_timestamp ON mv_recent_metrics(timestamp);
CREATE INDEX idx_mv_recent_metrics_sensor ON mv_recent_metrics(sensor_id);
```

### 3. Downsampled Historical Views

```sql
-- Hourly downsampling
CREATE MATERIALIZED VIEW mv_hourly_metrics AS
SELECT 
    sensor_id,
    date_trunc('hour', timestamp) AS hour,
    sensor_type,
    location,
    COUNT(*) AS reading_count,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
    COUNT(DISTINCT event_type) AS event_type_count,
    array_agg(DISTINCT event_type) AS event_types
FROM mv_recent_metrics
GROUP BY sensor_id, date_trunc('hour', timestamp), sensor_type, location
WITH DATA;

-- Daily downsampling (from hourly)
CREATE MATERIALIZED VIEW mv_daily_metrics AS
SELECT 
    sensor_id,
    date_trunc('day', hour) AS day,
    sensor_type,
    location,
    SUM(reading_count) AS reading_count,
    AVG(avg_value) AS avg_value,
    MIN(min_value) AS min_value,
    MAX(max_value) AS max_value,
    AVG(p95_value) AS avg_p95_value,
    SUM(event_type_count) AS event_type_count
FROM mv_hourly_metrics
GROUP BY sensor_id, date_trunc('day', hour), sensor_type, location
WITH DATA;

-- Add appropriate indexes
CREATE INDEX idx_mv_hourly_metrics_hour ON mv_hourly_metrics(hour);
CREATE INDEX idx_mv_daily_metrics_day ON mv_daily_metrics(day);
```

### 4. Combined View for Seamless Access

```sql
CREATE VIEW v_sensor_metrics AS
-- Recent detailed data
SELECT 
    sensor_id,
    timestamp,
    'detailed' AS resolution,
    value,
    NULL AS avg_value,
    NULL AS min_value,
    NULL AS max_value,
    event_type,
    sensor_type,
    location
FROM mv_recent_metrics
WHERE timestamp > (NOW() - INTERVAL '24 hours')

UNION ALL

-- Hourly data (between 1 day and 30 days old)
SELECT 
    sensor_id,
    hour AS timestamp,
    'hourly' AS resolution,
    NULL AS value,
    avg_value,
    min_value,
    max_value,
    NULL AS event_type,
    sensor_type,
    location
FROM mv_hourly_metrics
WHERE hour BETWEEN (NOW() - INTERVAL '30 days') AND (NOW() - INTERVAL '24 hours')

UNION ALL

-- Daily data (older than 30 days)
SELECT 
    sensor_id,
    day AS timestamp,
    'daily' AS resolution,
    NULL AS value,
    avg_value,
    min_value, 
    max_value,
    NULL AS event_type,
    sensor_type,
    location
FROM mv_daily_metrics
WHERE day < (NOW() - INTERVAL '30 days');
```

### 5. Refresh Strategy

```sql
-- Scheduled job to refresh recent data (every 5 minutes)
SELECT cron.schedule('*/5 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_metrics;
$$);

-- Hourly refresh of hourly aggregates
SELECT cron.schedule('5 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_metrics;
$$);

-- Daily refresh of daily aggregates
SELECT cron.schedule('10 0 * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;
$$);
```

## Usage Examples

```sql
-- Get last 2 hours of detailed data
SELECT * FROM v_sensor_metrics
WHERE timestamp > NOW() - INTERVAL '2 hours'
ORDER BY timestamp DESC;

-- Get daily summaries for the last 90 days
SELECT 
    date_trunc('day', timestamp) AS day,
    sensor_type,
    AVG(avg_value) AS overall_avg
FROM v_sensor_metrics
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', timestamp), sensor_type
ORDER BY day DESC;
```

## Performance Considerations

1. Ensure all materialized views have appropriate indexes
2. Consider using CONCURRENTLY for refreshes to avoid locks
3. For TimescaleDB users, replace with continuous aggregates for better automation
4. Use partitioning on base tables for efficient retention policies
5. Consider incrementally refreshable materialized views (3rd party extensions)

This architecture provides both high-resolution recent data and efficient historical analysis while minimizing storage requirements and computational overhead.
