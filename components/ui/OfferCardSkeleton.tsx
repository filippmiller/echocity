import { Skeleton } from './Skeleton'

export function OfferCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative aspect-[16/10] bg-gray-100">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <Skeleton className="absolute top-2 left-2 h-5 w-14 rounded-lg" />
        <Skeleton className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  )
}
