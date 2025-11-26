import React from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link, useLocation } from "react-router-dom";
import { NetworkSwitcher } from "../../../components/NetworkSwitcher";
import { IndexerSwitcher } from "../../../components/IndexerSwitcher";
import HelmetIcon from "../../../assets/helmet-v2-minimal.svg";

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
    <nav className="w-full sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-12 xl:px-20 2xl:px-32 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-white hover:opacity-80 transition-opacity">
            <img src={HelmetIcon} alt="Leviathan" className="w-7 h-7" />
            Leviathan
          </Link>
          {location.pathname !== "/" && (
            <div className="hidden md:flex items-center gap-4 text-sm text-white/60">
              <Link to="/pools" className="hover:text-white transition">
                Pools
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          <IndexerSwitcher />
          {currentAccount ? (
            <>
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 font-mono text-sm text-white/80">
                {getShortAddress(currentAccount.address)} s
              </span>
              <button
                onClick={() => disconnectWallet()}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
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
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm transition-colors"
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
