export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-neutral-300 bg-white px-4 py-8 text-sm text-neutral-600">
      {children}
    </div>
  );
}
