-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversationId UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    reasoning JSONB,
    functionCalls JSONB,
    functionOutputs JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation FOREIGN KEY (conversationId) REFERENCES conversations(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_updatedAt ON conversations(updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);

-- Create trigger to automatically update updatedAt on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updatedAt = CURRENT_TIMESTAMP 
    WHERE id = NEW.conversationId;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp(); 