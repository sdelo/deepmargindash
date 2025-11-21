import React from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link, useLocation } from "react-router-dom";
import { NetworkSwitcher } from "../../../components/NetworkSwitcher";
import DivingHelmetIcon from "../../../assets/diving-helment.svg";

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
    <nav className="w-full sticky top-0 z-50 backdrop-blur bg-black/20 border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-12 xl:px-20 2xl:px-32 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-wide text-cyan-200 hover:opacity-80 transition-opacity">
            <img src={DivingHelmetIcon} alt="Diving Helmet" className="w-8 h-8" />
            Leviathan
          </Link>
          {location.pathname !== "/" && (
            <div className="hidden md:flex items-center gap-4 text-sm text-indigo-200/80">
              <Link to="/pools" className="hover:text-white transition">
                Pools
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          {currentAccount ? (
            <>
              <span className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono text-sm text-indigo-100">
                {getShortAddress(currentAccount.address)} s
              </span>
              <button
                onClick={() => disconnectWallet()}
                className="px-3 py-2 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-100 text-sm"
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
                  className="px-3 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-sm"
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
