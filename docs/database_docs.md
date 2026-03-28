Perfect — let’s make this **PostgreSQL-native, production-grade**, not generic SQL.

I’ll give you:

* ✅ Optimized schema (indexes, enums, constraints)
* ✅ JSONB where it actually makes sense
* ✅ Query-ready structure for feeds
* ✅ Performance considerations

---

# 🧠 1. ENUMS (Postgres Best Practice)

Avoid raw TEXT for controlled fields.

```sql
CREATE TYPE cbt_category AS ENUM (
    'ANXIETY',
    'DEPRESSION',
    'TRAUMA',
    'STRESS',
    'GENERAL'
);

CREATE TYPE interaction_type AS ENUM (
    'VIEWED',
    'STARTED',
    'COMPLETED',
    'LIKED'
);

CREATE TYPE reaction_type AS ENUM (
    'UPVOTE',
    'HELPFUL'
);
```

---

# 🧠 2. EXTERNAL CBT PROGRAMS

```sql
CREATE TABLE external_cbt_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT,

    external_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_website TEXT,

    category cbt_category NOT NULL,
    difficulty_level TEXT,
    estimated_duration_minutes INT CHECK (estimated_duration_minutes > 0),

    metadata JSONB DEFAULT '{}'::jsonb,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_cbt_category ON external_cbt_programs(category);
CREATE INDEX idx_cbt_active ON external_cbt_programs(is_active);
```

---

# 👤 3. USER INTERACTIONS (EVENT-BASED)

```sql
CREATE TABLE user_cbt_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES external_cbt_programs(id) ON DELETE CASCADE,

    interaction_type interaction_type NOT NULL,
    interaction_value FLOAT DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Critical Indexes

```sql
CREATE INDEX idx_interactions_user ON user_cbt_interactions(user_id);
CREATE INDEX idx_interactions_program ON user_cbt_interactions(program_id);
CREATE INDEX idx_interactions_type ON user_cbt_interactions(interaction_type);
CREATE INDEX idx_interactions_time ON user_cbt_interactions(created_at DESC);
```

👉 Enables:

* Fast user history
* Trend calculation
* Time-based ranking

---

# ⭐ 4. COMMUNITY RECOMMENDATIONS

```sql
CREATE TABLE community_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    program_id UUID NOT NULL REFERENCES external_cbt_programs(id),

    title TEXT NOT NULL,
    message TEXT,

    username TEXT NOT NULL, -- anonymous identity handled here
    is_verified_user BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_recommendations_program ON community_recommendations(program_id);
CREATE INDEX idx_recommendations_time ON community_recommendations(created_at DESC);
```

---

# 👍 5. RECOMMENDATION REACTIONS

```sql
CREATE TABLE recommendation_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recommendation_id UUID NOT NULL REFERENCES community_recommendations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    reaction_type reaction_type NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (recommendation_id, user_id)
);
```

👉 Prevents duplicate reactions

---

# 📊 6. TRENDING AGGREGATE TABLE

👉 Precomputed for performance (VERY IMPORTANT)

```sql
CREATE TABLE program_trends (
    program_id UUID PRIMARY KEY REFERENCES external_cbt_programs(id) ON DELETE CASCADE,

    view_count INT DEFAULT 0,
    start_count INT DEFAULT 0,
    completion_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    recommendation_count INT DEFAULT 0,

    trend_score FLOAT DEFAULT 0,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

# ⚡ 7. USER PERSONALIZATION

```sql
CREATE TABLE user_category_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category cbt_category NOT NULL,

    weight FLOAT DEFAULT 1.0,

    UNIQUE(user_id, category)
);
```

---

# 🚀 8. FAST FEED CACHE (CRITICAL)

```sql
CREATE TABLE user_recommendation_scores (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES external_cbt_programs(id) ON DELETE CASCADE,

    score FLOAT NOT NULL,
    source TEXT NOT NULL, -- SYSTEM, COMMUNITY, TRENDING

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (user_id, program_id)
);
```

---

# 🧠 9. MATERIALIZED VIEW (OPTIONAL BUT POWERFUL)

## Trending Programs View

```sql
CREATE MATERIALIZED VIEW mv_trending_programs AS
SELECT
    p.id,
    p.title,
    t.trend_score
FROM external_cbt_programs p
JOIN program_trends t ON p.id = t.program_id
WHERE p.is_active = TRUE
ORDER BY t.trend_score DESC;
```

👉 Refresh:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_programs;
```

---

# 🔥 FEED QUERY (REAL PRODUCTION QUERY)

```sql
SELECT 
    p.id,
    p.title,
    p.description,
    COALESCE(urs.score, 0) +
    COALESCE(pt.trend_score, 0) AS final_score
FROM external_cbt_programs p
LEFT JOIN user_recommendation_scores urs
    ON p.id = urs.program_id AND urs.user_id = :user_id
LEFT JOIN program_trends pt
    ON p.id = pt.program_id
WHERE p.is_active = TRUE
ORDER BY final_score DESC
LIMIT 20;
```

---

# ⚡ PERFORMANCE NOTES (IMPORTANT)

### ✅ Use:

* `UUID` with `gen_random_uuid()`
* `TIMESTAMP WITH TIME ZONE`
* `JSONB` only for flexible metadata

### ❌ Avoid:

* Overusing JSONB for core fields
* Computing trends on the fly

---

# 🧠 ARCHITECTURE INSIGHT

You now have:

### Event Layer

→ `user_cbt_interactions`

### Social Layer

→ `community_recommendations`

### Aggregation Layer

→ `program_trends`

### Personalization Layer

→ `user_recommendation_scores`

---

