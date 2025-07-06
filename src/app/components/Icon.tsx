import React from "react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface IconProps {
  size?: IconSize;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  size = "md",
  className = "",
  children,
  onClick
}) => {
  const classes = ["icon", `icon-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </svg>
  );
};

// Pre-built icon components

// Style: Line
// Stroke width: 2px


export const MoonIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

export const SunIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Icon>
);

export const SignOutIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4M16 17l5-5-5-5M19.8 12H9"/>
  </Icon>
);