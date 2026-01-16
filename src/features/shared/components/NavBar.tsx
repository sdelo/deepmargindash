import React from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link, useLocation } from "react-router-dom";
import { NetworkSwitcher } from "../../../components/NetworkSwitcher";
import { IndexerSwitcher } from "../../../components/IndexerSwitcher";
import { brand } from "../../../config/brand";

export default function NavBar() {
  const currentAccount = useCurrentAccount();
  const [open, setOpen] = React.useState(false);
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const location = useLocation();

  function getShortAddress(address: string): string {
    if (!address) return "";
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
  }

  return (
    <nav className="w-full sticky top-0 z-50 bg-[#0c1a24]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-12 xl:px-20 2xl:px-32 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-white hover:opacity-90 transition-opacity group">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 p-1 border border-teal-500/20 group-hover:border-teal-500/30 transition-colors">
              <img src={brand.logo.src} alt={brand.logo.alt} className="w-full h-full" />
            </div>
            <span className="text-lg tracking-tight">{brand.name}</span>
          </Link>
          {location.pathname !== "/" && (
            <div className="hidden md:flex items-center">
              <Link 
                to="/pools" 
                className="px-3 py-1.5 rounded-md text-sm font-medium text-teal-300/90 hover:text-teal-200 hover:bg-teal-500/10 transition-all"
              >
                Pools
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <NetworkSwitcher />
          <IndexerSwitcher />
          {currentAccount ? (
            <>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-white/80">
                {getShortAddress(currentAccount.address)}
              </span>
              <button
                onClick={() => disconnectWallet()}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
              >
                Disconnect
              </button>
            </>
          ) : (
            <ConnectModal
              open={open}
              onOpenChange={setOpen}
              trigger={
                <button
                  onClick={() => setOpen(true)}
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  Connect Wallet
                </button>
              }
            />
          )}
        </div>
      </div>
    </nav>
  );
}
