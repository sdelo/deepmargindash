import React from "react";
import { Link } from "react-router-dom";
import HelmetIcon from "../assets/helmet-v2-minimal.svg";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={HelmetIcon} alt="Leviathan" className="w-8 h-8" />
            <div>
              <div className="font-bold text-white">Leviathan</div>
              <div className="text-sm text-white/50">DeepBook Margin Dashboard</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6">
            <FooterLink href="/pools" internal>Dashboard</FooterLink>
            <FooterLink href="https://docs.sui.io/guides/developer/deepbook">DeepBook Docs</FooterLink>
            <FooterLink href="https://twitter.com" placeholder>Twitter</FooterLink>
            <FooterLink href="https://discord.com" placeholder>Discord</FooterLink>
            <FooterLink href="https://github.com" placeholder>GitHub</FooterLink>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <div>
            Built for the DeepBook Community
          </div>
          <div>
            © {new Date().getFullYear()} Leviathan. Open source.
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  internal?: boolean;
  placeholder?: boolean;
}

function FooterLink({ href, children, internal, placeholder }: FooterLinkProps) {
  const className = `text-white/60 hover:text-white transition-colors ${placeholder ? 'opacity-50 cursor-not-allowed' : ''}`;
  
  if (internal) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  
  return (
    <a 
      href={placeholder ? undefined : href}
      target="_blank" 
      rel="noopener noreferrer" 
      className={className}
      onClick={placeholder ? (e) => e.preventDefault() : undefined}
    >
      {children}
      {placeholder && <span className="ml-1 text-xs">(soon)</span>}
    </a>
  );
}

