import React from "react";

interface OceanIconProps {
  name:
    | "wave"
    | "anchor"
    | "depth-gauge"
    | "treasure-chest"
    | "submarine"
    | "sonar";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const iconPaths = {
  wave: "/src/assets/icons/wave.svg",
  anchor: "/src/assets/icons/anchor.svg",
  "depth-gauge": "/src/assets/icons/depth-gauge.svg",
  "treasure-chest": "/src/assets/icons/treasure-chest.svg",
  submarine: "/src/assets/icons/submarine.svg",
  sonar: "/src/assets/icons/sonar.svg",
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function OceanIcon({
  name,
  className = "",
  size = "md",
  animated = false,
}: OceanIconProps) {
  const sizeClass = sizeClasses[size];
  const animationClass = animated ? "animate-pulse" : "";

  return (
    <div className={`${sizeClass} ${animationClass} ${className}`}>
      <img
        src={iconPaths[name]}
        alt={`${name} icon`}
        className="w-full h-full text-cyan-300 hover:text-amber-300 transition-colors duration-300"
      />
    </div>
  );
}

