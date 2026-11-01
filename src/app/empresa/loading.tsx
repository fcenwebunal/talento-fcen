import { CardsSkeleton, LoaderBar } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <>
      <LoaderBar />
      <div className="skeleton mb-6 h-10 w-72 max-w-full" />
      <CardsSkeleton count={6} />
    </>
  );
}
