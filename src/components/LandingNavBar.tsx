import { Link } from "react-router-dom";
import HelmetIcon from "../assets/helmet-v2-minimal.svg";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { IndexerSwitcher } from "./IndexerSwitcher";

export function LandingNavBar() {
  return (
    <nav className="w-full fixed top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left - Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-white text-lg hover:opacity-80 transition-opacity"
        >
          <img
            src={HelmetIcon}
            alt="Leviathan"
            className="w-7 h-7"
          />
          <span>Leviathan</span>
        </Link>

        {/* Right - Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <NetworkSwitcher />
            <IndexerSwitcher />
          </div>
          
          <Link
            to="/pools"
            className="btn-primary py-2 text-sm"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
