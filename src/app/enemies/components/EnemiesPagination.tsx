"use client";

import React from "react";
import { Pagination } from "@/components/ui/Pagination";

export interface EnemiesPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function EnemiesPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className = "",
}: EnemiesPaginationProps) {
  if (totalItems <= pageSize && currentPage === 1) return null;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      pageSizeOptions={[12, 24, 48]}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      showPageSize={true}
      itemLabel="monsters"
      scrollToTop={true}
      className={className}
    />
  );
}
