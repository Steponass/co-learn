import React from "react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface IconProps {
  size?: IconSize;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hover?: boolean;
}

export const Icon: React.FC<IconProps> = ({
  size = "md",
  className = "",
  children,
  onClick,
  hover = false,
}) => {
  const classes = ["icon", `icon-${size}`, hover && "icon-hover", className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </svg>
  );
};

// Pre-built icon components

export const MoonIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SunIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="5" strokeWidth="2" />
    <path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Icon>
);

export const SignOutIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16,17 21,12 16,7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);
