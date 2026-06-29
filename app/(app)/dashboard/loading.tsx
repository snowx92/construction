export default function Loading() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10 animate-fade-in">
      <div className="mb-10">
        <div className="skeleton h-3 w-24 mb-3" />
        <div className="skeleton h-9 w-64 mb-2" />
        <div className="skeleton h-4 w-48" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card px-5 py-5">
            <div className="skeleton h-3 w-24 mb-3" />
            <div className="skeleton h-8 w-32 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card h-80 bg-surface-2" />
        <div className="space-y-6">
          <div className="card h-36 bg-surface-2" />
          <div className="card h-36 bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
