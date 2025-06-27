const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://desyagvwhkpjnauadwpk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3lhZ3Z3aGtwam5hdWFkd3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzUwNzE5MCwiZXhwIjoyMDUzMDgzMTkwfQ.fbf9e69ffbb33bc0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleData() {
  console.log('🚀 Adding sample data to ChatMCP...\n');

  try {
    // Add sample conversations
    console.log('1. Creating sample conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .insert([
        {
          title: 'Welcome to ChatMCP',
          user_id: 'anonymous'
        },
        {
          title: 'Getting Started Guide',
          user_id: 'anonymous'
        },
        {
          title: 'MCP Tool Integration Demo',
          user_id: 'anonymous'
        }
      ])
      .select();

    if (convError) {
      console.error('Error creating conversations:', convError);
      return;
    }

    console.log(`✅ Created ${conversations.length} sample conversations\n`);

    // Add sample messages
    console.log('2. Creating sample messages...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversations[0].id,
          role: 'assistant',
          content: 'Welcome to ChatMCP! 🚀\n\nI\'m powered by OpenAI\'s o3 model with Model Context Protocol (MCP) tool integration. This means I can use various tools and services to help you with tasks.\n\nTry asking me about:\n• Weather information\n• Code generation and analysis\n• Data processing\n• Or any other task you need help with!'
        },
        {
          conversation_id: conversations[1].id,
          role: 'user',
          content: 'How do I get started with this platform?'
        },
        {
          conversation_id: conversations[1].id,
          role: 'assistant',
          content: 'Great question! Here\'s how to get started with ChatMCP:\n\n1. **Start a conversation** - Just type your question or request\n2. **I\'ll use MCP tools** - I can access various services like Slack, GitHub, weather APIs, etc.\n3. **Get real-time responses** - I\'ll stream responses as I process your request\n4. **Save your conversations** - All chats are automatically saved to your account\n\nTry asking me something like:\n• "What\'s the weather like in San Francisco?"\n• "Help me create a React component"\n• "Send a message to my Slack channel"\n\nWhat would you like to try first?'
        },
        {
          conversation_id: conversations[2].id,
          role: 'user',
          content: 'Can you show me how MCP tools work?'
        },
        {
          conversation_id: conversations[2].id,
          role: 'assistant',
          content: 'Absolutely! MCP (Model Context Protocol) tools allow me to interact with external services and APIs. Here\'s how it works:\n\n🔧 **Available MCP Tools:**\n• **Slack Integration** - Send messages, read channels, manage workspaces\n• **GitHub Integration** - Access repositories, create issues, manage code\n• **Weather APIs** - Get real-time weather data\n• **Custom Tools** - Any service that supports MCP\n\n💡 **How it works:**\n1. You ask me to do something\n2. I determine which tools I need\n3. I call the appropriate MCP endpoints\n4. I process the results and respond\n\nTry asking me to:\n• "Get the current weather in New York"\n• "Create a new GitHub issue"\n• "Send a message to my Slack team"\n\nI\'ll demonstrate the MCP integration in action!'
        }
      ])
      .select();

    if (msgError) {
      console.error('Error creating messages:', msgError);
      return;
    }

    console.log(`✅ Created ${messages.length} sample messages\n`);

    console.log('🎉 Sample data added successfully!');
    console.log('\nYour ChatMCP platform now has:');
    console.log(`• ${conversations.length} sample conversations`);
    console.log(`• ${messages.length} sample messages`);
    console.log('\nNext steps:');
    console.log('1. Refresh your app at: https://chatmcp.vercel.app');
    console.log('2. You should see the sample conversations in the sidebar');
    console.log('3. Click on any conversation to see the messages');
    console.log('4. Start creating your own conversations!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData(); 