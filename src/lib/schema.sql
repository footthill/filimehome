-- Migration script to add replies and likes support

-- 1. Add parent_id to comments_filimehome if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments_filimehome' AND column_name='parent_id') THEN
        ALTER TABLE comments_filimehome ADD COLUMN parent_id UUID REFERENCES comments_filimehome(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create Likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS likes_filimehome (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments_filimehome(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_filimehome(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- 3. Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments_filimehome(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes_filimehome(comment_id);

-- Full schema for reference
/*
CREATE TABLE IF NOT EXISTS users_filimehome (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments_filimehome (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id TEXT NOT NULL,
    user_id UUID REFERENCES users_filimehome(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments_filimehome(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
*/
