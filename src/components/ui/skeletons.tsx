export function LoaderBar() {
  return <div className="loader-bar" role="progressbar" aria-label="Cargando" />;
}

export function HeaderSkeleton() {
  return (
    <div className="bg-hero">
      <div className="wrap pb-16 pt-12">
        <div className="skeleton h-3 w-28 opacity-30" />
        <div className="skeleton mt-4 h-9 w-72 max-w-full opacity-30" />
        <div className="skeleton mt-3 h-4 w-96 max-w-full opacity-20" />
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 6, columns = "md:grid-cols-2 xl:grid-cols-3" }: { count?: number; columns?: string }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ animation: `fade-in 0.4s ${i * 60}ms both` }}>
          <div className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="skeleton mt-4 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <LoaderBar />
      <HeaderSkeleton />
      <div className="wrap py-8">
        <CardsSkeleton count={count} />
      </div>
    </>
  );
}
