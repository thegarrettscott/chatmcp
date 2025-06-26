import { create } from 'zustand'

export interface Tool {
  id: string
  name: string
  description: string
  enabled: boolean
  category: string
}

interface ToolStore {
  tools: Tool[]
  selectedTools: string[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setTools: (tools: Tool[]) => void
  toggleTool: (toolId: string) => void
  enableTool: (toolId: string) => void
  disableTool: (toolId: string) => void
  setSelectedTools: (toolIds: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const defaultTools: Tool[] = [
  {
    id: 'file-search',
    name: 'File Search',
    description: 'Search for files in the workspace',
    enabled: true,
    category: 'filesystem'
  },
  {
    id: 'code-search',
    name: 'Code Search',
    description: 'Search for code patterns and functions',
    enabled: true,
    category: 'development'
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    enabled: false,
    category: 'research'
  },
  {
    id: 'database-query',
    name: 'Database Query',
    description: 'Query the application database',
    enabled: false,
    category: 'data'
  }
]

export const useToolStore = create<ToolStore>((set, get) => ({
  tools: defaultTools,
  selectedTools: ['file-search', 'code-search'],
  isLoading: false,
  error: null,

  setTools: (tools) => set({ tools }),
  
  toggleTool: (toolId) => {
    const { tools, selectedTools } = get()
    const tool = tools.find(t => t.id === toolId)
    if (!tool) return

    const updatedTools = tools.map(t => 
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    )
    
    const updatedSelectedTools = tool.enabled
      ? selectedTools.filter(id => id !== toolId)
      : [...selectedTools, toolId]

    set({ 
      tools: updatedTools,
      selectedTools: updatedSelectedTools
    })
  },

  enableTool: (toolId) => {
    const { tools, selectedTools } = get()
    const updatedTools = tools.map(t => 
      t.id === toolId ? { ...t, enabled: true } : t
    )
    const updatedSelectedTools = selectedTools.includes(toolId) 
      ? selectedTools 
      : [...selectedTools, toolId]
    
    set({ 
      tools: updatedTools,
      selectedTools: updatedSelectedTools
    })
  },

  disableTool: (toolId) => {
    const { tools, selectedTools } = get()
    const updatedTools = tools.map(t => 
      t.id === toolId ? { ...t, enabled: false } : t
    )
    const updatedSelectedTools = selectedTools.filter(id => id !== toolId)
    
    set({ 
      tools: updatedTools,
      selectedTools: updatedSelectedTools
    })
  },

  setSelectedTools: (toolIds) => set({ selectedTools: toolIds }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    tools: defaultTools,
    selectedTools: ['file-search', 'code-search'],
    isLoading: false,
    error: null
  })
})) 