import React from "react";
import { Link } from "react-router-dom";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import DivingHelmetIcon from "../assets/diving-helment.svg";
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
    <nav className="w-full fixed top-0 z-50 backdrop-blur bg-black/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold tracking-wide text-cyan-200 text-xl hover:opacity-80 transition-opacity"
          >
            <img
              src={DivingHelmetIcon}
              alt="Diving Helmet"
              className="w-6 h-6"
            />
            Leviathan
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NetworkSwitcher />
          <IndexerSwitcher />
          {currentAccount ? (
            <>
              <span className="px-3 py-1 rounded bg-white/10 border border-white/20 font-mono text-sm text-indigo-100">
                {getShortAddress(currentAccount.address)}
              </span>
              <button
                onClick={() => disconnectWallet()}
                className="px-4 py-2 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-100 text-sm"
              >
                Disconnect
              </button>
              <Link
                to="/pools"
                className="btn-primary px-4 py-2 text-white font-semibold rounded-xl transition-all duration-300"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <ConnectModal
                open={open}
                onOpenChange={setOpen}
                trigger={
                  <button
                    onClick={() => setOpen(true)}
                    className="pill px-4 py-2 text-cyan-200 text-sm hover:bg-cyan-300/20 hover:text-white transition-all duration-300"
                  >
                    Connect Wallet
                  </button>
                }
              />
              <Link
                to="/pools"
                className="btn-primary px-4 py-2 text-white font-semibold rounded-xl transition-all duration-300"
              >
                Explore Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
