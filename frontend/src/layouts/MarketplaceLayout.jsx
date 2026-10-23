import React from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function MarketplaceLayout() {
  return (
    <div className="app-shell">
      <AppHeader/>
      <main className="page-content">
        <Outlet/>
      </main>
    </div>
  );
}
