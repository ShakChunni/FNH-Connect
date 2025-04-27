"use client";
import React, { createContext, useContext, useCallback } from "react";

type TableSelectorContextType = {
  tableSelectorValue: string;
  handleTableSelectorChange: (value: string) => void;
};

const TableSelectorContext = createContext<
  TableSelectorContextType | undefined
>(undefined);

export function TableSelectorProvider({
  children,
  value,
  onChange,
  onFilterUpdate,
}: {
  children: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onFilterUpdate?: (value: string) => void;
}) {
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (onFilterUpdate) {
        onFilterUpdate(newValue);
      }
    },
    [onChange, onFilterUpdate]
  );
  return (
    <TableSelectorContext.Provider
      value={{
        tableSelectorValue: value,
        handleTableSelectorChange: handleChange,
      }}
    >
      {children}
    </TableSelectorContext.Provider>
  );
}

export function useTableSelector() {
  const context = useContext(TableSelectorContext);
  if (!context) {
    throw new Error(
      "useTableSelector must be used within TableSelectorProvider"
    );
  }
  return context;
}
