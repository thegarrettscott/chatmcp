-- Supabase Migration for ChatMCP Platform
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    reasoning JSONB,
    function_calls JSONB,
    function_outputs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        user_id = 'anonymous'  -- Allow anonymous access for demo
    );

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id OR 
        user_id = 'anonymous'  -- Allow anonymous access for demo
    );

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        auth.uid()::text = user_id OR 
        user_id = 'anonymous'  -- Allow anonymous access for demo
    );

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (
        auth.uid()::text = user_id OR 
        user_id = 'anonymous'  -- Allow anonymous access for demo
    );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Enable realtime for real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
INSERT INTO conversations (id, title, user_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Welcome to ChatMCP', 'anonymous'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Getting Started Guide', 'anonymous');

INSERT INTO messages (conversation_id, role, content) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'assistant', 'Welcome to ChatMCP! I''m powered by OpenAI''s o3 model with MCP tool integration. How can I help you today?'),
    ('550e8400-e29b-41d4-a716-446655440002', 'user', 'How do I get started with this platform?'),
    ('550e8400-e29b-41d4-a716-446655440002', 'assistant', 'Great question! This platform combines the power of OpenAI''s o3 model with Model Context Protocol (MCP) tools. You can start by asking me questions, and I''ll use various tools to help you. Try asking about the weather, or request help with coding!');
*/

-- Grant necessary permissions (Supabase handles this automatically, but explicit for clarity)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON conversations TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'ChatMCP database schema created successfully! 🚀' as result; 