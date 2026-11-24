"use client";

import React from "react";
import { Pagination } from "@/components/ui/Pagination";

export interface ItemsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function ItemsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className = "",
}: ItemsPaginationProps) {
  if (totalItems === 0) return null;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      pageSizeOptions={[25, 50, 100]}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      showPageSize={true}
      itemLabel="items"
      scrollToTop={true}
      className={className}
    />
  );
}
