"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AdminSidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null);

const STORAGE_KEY = "tempcdn-admin-sidebar-open";

/**
 * Shares sidebar open/closed state between AdminHeader's toggle button and
 * AdminSidebar itself, since they're siblings under DashboardLayout rather
 * than parent/child. Defaults to open on desktop-sized screens and closed
 * on small screens, then persists whatever the admin picks afterwards.
 */
export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === "true");
    } else {
      setIsOpen(window.matchMedia("(min-width: 1024px)").matches);
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) return prev;
      // Only auto-close on small screens - on desktop the sidebar is part
      // of the persistent layout, so a nav click shouldn't collapse it.
      if (window.matchMedia("(min-width: 1024px)").matches) return prev;
      window.localStorage.setItem(STORAGE_KEY, "false");
      return false;
    });
  }, []);

  return (
    <AdminSidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar(): AdminSidebarContextValue {
  const ctx = useContext(AdminSidebarContext);
  if (!ctx) {
    throw new Error("useAdminSidebar must be used within AdminSidebarProvider");
  }
  return ctx;
}
