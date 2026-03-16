"use client";

/**
 * DooIcon — doo-iconik React bridge component for AskSUSSi.
 *
 * Renders hand-drawn doodle-style SVG icons from the doo-iconik open-source set.
 * Source: https://github.com/ajentik/doo-iconik (MIT)
 *
 * Usage:
 *   import { DooIcon } from "@/lib/icons";
 *   <DooIcon name="send" size={18} className="text-primary" />
 */

import { forwardRef } from "react";
import { iconData, type IconName } from "./icon-data";

export interface DooIconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  /** Icon name from the doo-iconik subset available to this app. */
  name: IconName;
  /** Pixel size (width & height). Default 24. */
  size?: number;
}

export const DooIcon = forwardRef<SVGSVGElement, DooIconProps>(
  function DooIcon({ name, size = 24, className, style, ...rest }, ref) {
    const icon = iconData[name];
    if (!icon) return null;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icon.viewBox}
        width={size}
        height={size}
        fill={icon.stroke ? "none" : "currentColor"}
        stroke={icon.stroke ? "currentColor" : undefined}
        strokeWidth={icon.stroke ? 2 : undefined}
        strokeLinecap={icon.stroke ? "round" : undefined}
        strokeLinejoin={icon.stroke ? "round" : undefined}
        className={className}
        style={style}
        aria-hidden="true"
        {...rest}
      >
        {icon.paths.map((d) => (
          <path key={d.slice(0, 32)} d={d} />
        ))}
        {icon.circles?.map((c) => (
          <circle key={`${c.cx}-${c.cy}-${c.r}`} cx={c.cx} cy={c.cy} r={c.r} />
        ))}
        {icon.lines?.map((l) => (
          <line key={`${l.x1}-${l.y1}-${l.x2}-${l.y2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </svg>
    );
  },
);
