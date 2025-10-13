import { Outlet } from "react-router-dom";
import NavBar from "../features/shared/components/NavBar";

export function MainLayout() {
  return (
    <div className="min-h-screen pb-8 relative">
      <NavBar />
      <div className="plankton-layer" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="plankton-dot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${18 + Math.random() * 20}s`,
              animationDelay: `${-Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
