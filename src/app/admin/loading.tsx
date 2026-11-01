import { CardsSkeleton, LoaderBar } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <>
      <LoaderBar />
      <div className="skeleton mb-6 h-12 w-64" />
      <CardsSkeleton count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
    </>
  );
}
