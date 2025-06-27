'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a timestamp-related error
    const isTimestampError = error.message.includes('toLocaleDateString') ||
                            error.message.includes('toLocaleTimeString') ||
                            error.message.includes('timestamp') ||
                            error.stack?.includes('timestamp')

    return { 
      hasError: true, 
      error: isTimestampError ? error : undefined
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleClearStorage = () => {
    try {
      // Clear all chat-related storage
      localStorage.removeItem('chat-storage')
      localStorage.removeItem('chat-store')
      
      // Clear any other potential storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.includes('chat') || key.includes('conversation')) {
          localStorage.removeItem(key)
        }
      })
      
      // Reload the page
      window.location.reload()
    } catch (error) {
      console.error('Error clearing storage:', error)
      // Force reload anyway
      window.location.reload()
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const isTimestampError = this.state.error?.message.includes('timestamp') ||
                              this.state.error?.message.includes('toLocaleDateString') ||
                              this.state.error?.message.includes('toLocaleTimeString')

      if (isTimestampError) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center max-w-md p-6">
              <RefreshCw className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-4">Data Format Issue</h1>
              <p className="text-muted-foreground mb-6">
                There&apos;s an issue with stored conversation data format. 
                This usually happens after updates. Clearing the stored data will fix this.
              </p>
              <div className="space-y-3">
                <Button onClick={this.handleClearStorage} className="w-full">
                  Clear Storage & Reload
                </Button>
                <Button variant="outline" onClick={this.handleRetry} className="w-full">
                  Try Again
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Don&apos;t worry - your conversations are backed up on the server
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-6">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleRetry} className="w-full">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 