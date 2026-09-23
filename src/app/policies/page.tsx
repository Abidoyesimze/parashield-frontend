'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { usePolicies } from '@/hooks/usePolicies';
import { PolicyCard } from '@/components/PolicyCard';
import { ConnectWalletPrompt } from '@/components/ConnectWalletPrompt';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import Link from 'next/link';

type Filter = 'All' | 'Active' | 'Pending' | 'Processing' | 'Expired' | 'Claimed' | 'Cancelled';

const FILTERS: Filter[] = ['All', 'Active', 'Pending', 'Processing', 'Expired', 'Claimed', 'Cancelled'];

// Loading skeleton count for better perceived performance
const SKELETON_COUNT = 6;

export default function PoliciesPage() {
  const { address, connected } = useWallet();
  const { policies, loading, error, refetch } = usePolicies(address);
  const [filter, setFilter] = useState<Filter>('All');
  const [page, setPage] = useState(0);
  const POLICIES_PER_PAGE = 12;

  // Early return for disconnected wallet
  if (!connected) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">
        <ConnectWalletPrompt message="Connect your wallet to view your policies" />
      </main>
    );
  }

  // Memoize status counts to prevent recalculation on every render
  const statusCounts = useMemo(
    () =>
      policies.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      }, {}),
    [policies]
  );

  // Memoize filter counts for performance
  const filterCounts: Record<Filter, number> = useMemo(
    () => ({
      All: policies.length,
      Active: statusCounts['Active'] ?? 0,
      Pending: statusCounts['Pending'] ?? 0,
      Processing: statusCounts['Processing'] ?? 0,
      Expired: statusCounts['Expired'] ?? 0,
      Claimed: statusCounts['Claimed'] ?? 0,
      Cancelled: statusCounts['Cancelled'] ?? 0,
    }),
    [policies.length, statusCounts]
  );

  const filteredPolicies = useMemo(
    () => (filter === 'All' ? policies : policies.filter((p) => p.status === filter)),
    [filter, policies]
  );

  const totalPages = Math.ceil(filteredPolicies.length / POLICIES_PER_PAGE);
  const paginatedPolicies = filteredPolicies.slice(
    page * POLICIES_PER_PAGE,
    (page + 1) * POLICIES_PER_PAGE
  );

  // Reset to first page when filter changes
  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    setPage(0);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Policies</h1>
          <p className="mt-1 text-sm text-gray-400">
            {loading ? (
              <span className="inline-block animate-pulse">Loading policies...</span>
            ) : filter === 'All' ? (
              `${policies.length} total ${policies.length === 1 ? 'policy' : 'policies'}`
            ) : (
              `${filteredPolicies.length} ${filter.toLowerCase()} ${
                filteredPolicies.length === 1 ? 'policy' : 'policies'
              }`
            )}
          </p>
        </div>

        {!loading && policies.length > 0 && (
          <div className="flex flex-wrap gap-2" role="status" aria-label="Policy status summary">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span
                key={status}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                <Badge label={status} />
                <span className="text-gray-400" aria-label={`${count} ${status} policies`}>
                  {count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {!loading && policies.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Policy filter tabs">
          {FILTERS.map((tab) => {
            const count = filterCounts[tab];
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                aria-controls="policies-grid"
                onClick={() => handleFilterChange(tab)}
                disabled={count === 0 && !isActive}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-500 text-white'
                    : count === 0
                      ? 'border border-white/5 text-gray-400 cursor-not-allowed opacity-50'
                      : 'border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {tab}
                <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div 
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="status"
          aria-label="Loading policies"
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error && policies.length === 0 ? (
        <EmptyState
          icon="⚠️"
          title="Failed to load policies"
          description={error}
          action={
            <button
              onClick={() => void refetch()}
              className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 transition-colors"
            >
              Try again
            </button>
          }
        />
      ) : policies.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No policies yet"
          description="Buy your first parametric insurance policy from the products marketplace."
          action={
            <Link href="/" className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 transition-colors">
              Browse products
            </Link>
          }
        />
      ) : filteredPolicies.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={`No ${filter.toLowerCase()} policies`}
          description="Try a different filter to see your other policies."
        />
      ) : (
        <>
          <div 
            id="policies-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="region"
            aria-label={`${filter} policies grid`}
          >
            {paginatedPolicies.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between" role="navigation" aria-label="Pagination">
              <p className="text-xs text-gray-400">
                Showing {page * POLICIES_PER_PAGE + 1}–
                {Math.min((page + 1) * POLICIES_PER_PAGE, filteredPolicies.length)} of{' '}
                {filteredPolicies.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:border-white/20 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:border-white/20 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
