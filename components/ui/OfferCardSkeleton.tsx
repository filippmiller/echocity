import { Skeleton } from './Skeleton'

export function OfferCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  )
}
