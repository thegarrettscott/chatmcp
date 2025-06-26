export function ToolsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-2">My Tools</h2>
        <p>Tool management UI coming soon.</p>
        <button onClick={() => onOpenChange(false)} className="mt-4 px-4 py-2 bg-primary text-white rounded">
          Close
        </button>
      </div>
    </div>
  );
} 