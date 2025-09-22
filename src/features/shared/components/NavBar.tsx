import React from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";

export default function NavBar() {
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
    <nav className="w-full sticky top-0 z-50 backdrop-blur bg-black/20 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <a href="/" className="font-extrabold tracking-wide text-cyan-200">
            DeepDashboard
          </a>
          <div className="hidden md:flex items-center gap-4 text-sm text-indigo-200/80">
            <a href="#pools" className="hover:text-white transition">
              Pools
            </a>
            <a href="#analytics" className="hover:text-white transition">
              Analytics
            </a>
            <a href="#admin" className="hover:text-white transition">
              Admin
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentAccount ? (
            <>
              <span className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono text-sm text-indigo-100">
                {getShortAddress(currentAccount.address)}
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
