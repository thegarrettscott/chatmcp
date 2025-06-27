const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://desyagvwhkpjnauadwpk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3lhZ3Z3aGtwam5hdWFkd3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzUwNzE5MCwiZXhwIjoyMDUzMDgzMTkwfQ.fbf9e69ffbb33bc0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up ChatMCP Database Schema...\n');

  try {
    // Enable UUID extension
    console.log('1. Creating UUID extension...');
    await supabase.rpc('exec_sql', {
      query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });
    console.log('✅ UUID extension created\n');

    // Create conversations table
    console.log('2. Creating conversations table...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Conversations table created\n');

    // Create messages table
    console.log('3. Creating messages table...');
    await supabase.rpc('exec_sql', {
      query: `
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
      `
    });
    console.log('✅ Messages table created\n');

    // Create indexes
    console.log('4. Creating indexes...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      `
    });
    console.log('✅ Indexes created\n');

    // Enable RLS
    console.log('5. Enabling Row Level Security...');
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      `
    });
    console.log('✅ RLS enabled\n');

    // Create RLS policies
    console.log('6. Creating RLS policies...');
    await supabase.rpc('exec_sql', {
      query: `
        DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
        DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
        DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;

        CREATE POLICY "Users can view their own conversations" ON conversations
          FOR SELECT USING (
            auth.uid()::text = user_id OR 
            user_id = 'anonymous'
          );

        CREATE POLICY "Users can insert their own conversations" ON conversations
          FOR INSERT WITH CHECK (
            auth.uid()::text = user_id OR 
            user_id = 'anonymous'
          );

        CREATE POLICY "Users can update their own conversations" ON conversations
          FOR UPDATE USING (
            auth.uid()::text = user_id OR 
            user_id = 'anonymous'
          );

        CREATE POLICY "Users can delete their own conversations" ON conversations
          FOR DELETE USING (
            auth.uid()::text = user_id OR 
            user_id = 'anonymous'
          );

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
      `
    });
    console.log('✅ RLS policies created\n');

    // Create trigger function
    console.log('7. Creating trigger function...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION update_conversation_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE conversations 
          SET updated_at = NOW() 
          WHERE id = NEW.conversation_id;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Trigger function created\n');

    // Create trigger
    console.log('8. Creating trigger...');
    await supabase.rpc('exec_sql', {
      query: `
        DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
        CREATE TRIGGER trigger_update_conversation_updated_at
          AFTER INSERT OR UPDATE ON messages
          FOR EACH ROW
          EXECUTE FUNCTION update_conversation_updated_at();
      `
    });
    console.log('✅ Trigger created\n');

    // Enable realtime
    console.log('9. Enabling realtime...');
    await supabase.rpc('exec_sql', {
      query: `
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
      `
    });
    console.log('✅ Realtime enabled\n');

    // Grant permissions
    console.log('10. Granting permissions...');
    await supabase.rpc('exec_sql', {
      query: `
        GRANT USAGE ON SCHEMA public TO anon, authenticated;
        GRANT ALL ON conversations TO anon, authenticated;
        GRANT ALL ON messages TO anon, authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
      `
    });
    console.log('✅ Permissions granted\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\nYour ChatMCP platform is now ready for production! 🚀');
    console.log('\nNext steps:');
    console.log('1. Refresh your app at: https://chatmcp.vercel.app');
    console.log('2. Start creating conversations');
    console.log('3. Test the MCP tool integration');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 