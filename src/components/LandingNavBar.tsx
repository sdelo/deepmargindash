import React from "react";
import { Link } from "react-router-dom";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import HelmetIcon from "../assets/helmet-v2-minimal.svg";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { IndexerSwitcher } from "./IndexerSwitcher";

export function LandingNavBar() {
  const currentAccount = useCurrentAccount();
  const [open, setOpen] = React.useState(false);
  const { mutate: disconnectWallet } = useDisconnectWallet();

  function getShortAddress(address: string): string {
    if (!address) return "";
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
  }

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
          
          {currentAccount ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 font-mono text-sm text-white/80">
                {getShortAddress(currentAccount.address)}
              </span>
              <button
                onClick={() => disconnectWallet()}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
              >
                Disconnect
              </button>
              <Link
                to="/pools"
                className="btn-primary py-2 text-sm"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ConnectModal
                open={open}
                onOpenChange={setOpen}
                trigger={
                  <button
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm transition-colors"
                  >
                    Connect Wallet
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
