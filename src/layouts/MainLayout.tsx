import { Outlet } from "react-router-dom";
import NavBar from "../features/shared/components/NavBar";

export function MainLayout() {
  return (
    <div className="min-h-screen pb-8 relative">
      <NavBar />
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
