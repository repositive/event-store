CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS events(
    id UUID DEFAULT uuid_generate_v4() primary key,
    data JSONB NOT NULL,
    context JSONB DEFAULT '{}',
    time TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aggregate_cache(
    id VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR NOT NULL default '',
    data JSONB NOT NULL,
    -- PRIMARY KEY(id, aggregate_type),
    PRIMARY KEY(id),
    time TIMESTAMP DEFAULT now()
);
