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
  onClick,
}) => {
  const classes = ["icon", `icon-${size}`, className].filter(Boolean).join(" ");

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
    <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4M16 17l5-5-5-5M19.8 12H9" />
  </Icon>
);

export const CamOnIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z" />
  </Icon>
);

export const CamOffIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M2 2l19.8 19.8M15 15.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h.3m5.4 0H13a2 2 0 0 1 2 2v3.3l1 1L22 7v10" />
  </Icon>
);

export const MicOnIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </Icon>
);

export const MicOffIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Icon>
);

export const ScreenShareOnIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </Icon>
);

export const ScreenShareOffIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </Icon>
);

export const ChatOnIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2z" />
  </Icon>
);

export const ChatOffIcon: React.FC<Omit<IconProps, "children">> = (props) => (
  <Icon {...props}>
    <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2z" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </Icon>
);

export const LayoutHorizontalIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
  </Icon>
);

export const LayoutVerticalIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </Icon>
);

export const SelfViewOnIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <ellipse cx="12" cy="12" rx="8" ry="5" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
);

export const SelfViewOffIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <ellipse cx="12" cy="12" rx="8" ry="5" />
    <circle cx="12" cy="12" r="2" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </Icon>
);

export const FullScreenOnIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <path d="M4 14h6v6M3 21l6.1-6.1M20 10h-6V4M21 3l-6.1 6.1" />
  </Icon>
);

export const FullScreenOffIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" />
  </Icon>
);

export const BackgroundBlurOnIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <ellipse cx="12" cy="15.6" rx="4.8" ry="3.6" />
    <circle cx="12" cy="10.6" r="2.4" />
    <circle cx="8" cy="8" r="1.2" />
    <circle cx="18" cy="9" r="1.44" />
    <circle cx="9.6" cy="19.6" r="0.96" />
    <circle cx="17.2" cy="19.6" r="0.84" />
  </Icon>
);

export const BackgroundBlurOffIcon: React.FC<Omit<IconProps, "children">> = (
  props
) => (
  <Icon {...props}>
    <ellipse cx="12" cy="15.6" rx="4.8" ry="3.6" />
    <circle cx="12" cy="10.6" r="2.4" />
    <circle cx="8" cy="8" r="1.2" />
    <circle cx="18" cy="9" r="1.44" />
    <circle cx="9.6" cy="19.6" r="0.96" />
    <circle cx="17.2" cy="19.6" r="0.84" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </Icon>
);
