"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Topbar dropdown:
 * - Single portal-based dropdown anchored to viewport coordinates (getBoundingClientRect).
 * - Hover-to-switch with small debounce.
 * - Uses event.composedPath()/path to reliably detect outside clicks and close on a single click.
 *
 * Minimal, focused on behavior (positioning + outside-click reliability) while preserving styling.
 */

type MenuKey = "file" | "edit" | "view" | "help" | null;

const MENU_ITEMS: Record<
  Exclude<MenuKey, null>,
  Array<{ label: string; action?: () => void; shortcut?: string }>
> = {
  file: [
    {
      label: "New",
      action: () => console.log("File -> New"),
      shortcut: "Ctrl+N",
    },
    {
      label: "Open...",
      action: () => console.log("File -> Open"),
      shortcut: "Ctrl+O",
    },
    {
      label: "Save",
      action: () => console.log("File -> Save"),
      shortcut: "Ctrl+S",
    },
    {
      label: "Save As...",
      action: () => console.log("File -> Save As"),
      shortcut: "Ctrl+Shift+S",
    },
    { label: "Close", action: () => console.log("File -> Close") },
  ],
  edit: [
    {
      label: "Undo",
      action: () => console.log("Edit -> Undo"),
      shortcut: "Ctrl+Z",
    },
    {
      label: "Redo",
      action: () => console.log("Edit -> Redo"),
      shortcut: "Ctrl+Y",
    },
    {
      label: "Cut",
      action: () => console.log("Edit -> Cut"),
      shortcut: "Ctrl+X",
    },
    {
      label: "Copy",
      action: () => console.log("Edit -> Copy"),
      shortcut: "Ctrl+C",
    },
    {
      label: "Paste",
      action: () => console.log("Edit -> Paste"),
      shortcut: "Ctrl+V",
    },
    {
      label: "Find",
      action: () => console.log("Edit -> Find"),
      shortcut: "Ctrl+F",
    },
  ],
  view: [
    {
      label: "Toggle Sidebar",
      action: () => console.log("View -> Toggle Sidebar"),
    },
    {
      label: "Zoom In",
      action: () => console.log("View -> Zoom In"),
      shortcut: "Ctrl++",
    },
    {
      label: "Zoom Out",
      action: () => console.log("View -> Zoom Out"),
      shortcut: "Ctrl+-",
    },
    {
      label: "Toggle Fullscreen",
      action: () => console.log("View -> Toggle Fullscreen"),
      shortcut: "F11",
    },
  ],
  help: [
    {
      label: "Documentation",
      action: () => console.log("Help -> Documentation"),
    },
    {
      label: "Report an Issue",
      action: () => console.log("Help -> Report Issue"),
    },
    { label: "About", action: () => console.log("Help -> About") },
  ],
};

export default function Topbar() {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  // viewport anchor for portal positioning
  const [anchor, setAnchor] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const rootRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const labelRefs: Record<
    Exclude<MenuKey, null>,
    React.RefObject<HTMLButtonElement>
  > = {
    file: useRef<HTMLButtonElement | null>(null),
    edit: useRef<HTMLButtonElement | null>(null),
    view: useRef<HTMLButtonElement | null>(null),
    help: useRef<HTMLButtonElement | null>(null),
  };

  // debounce for hover switching + last anchor to avoid tiny redundant updates
  const hoverTimer = useRef<number | null>(null);
  const lastAnchor = useRef<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  // keep simple UI state
  const [showSidebar, setShowSidebar] = useState(true);

  // measure button rect in viewport coords
  const computeViewportAnchor = (k: Exclude<MenuKey, null>) => {
    const btn = labelRefs[k].current;
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      top: Math.round(r.bottom),
      width: Math.round(r.width),
    };
  };

  const openAnchored = (k: Exclude<MenuKey, null>) => {
    const a = computeViewportAnchor(k);
    if (a) {
      lastAnchor.current = a;
      setAnchor(a);
    }
    setOpenMenu(k);
  };

  const toggleMenu = (k: Exclude<MenuKey, null>) => {
    if (openMenu === k) {
      setOpenMenu(null);
      setAnchor(null);
      lastAnchor.current = null;
    } else {
      openAnchored(k);
    }
  };

  // hover to switch with debounce + small dedupe tolerance
  const hoverSwitch = (k: Exclude<MenuKey, null>) => {
    if (!openMenu || openMenu === k) return;
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    hoverTimer.current = window.setTimeout(() => {
      const a = computeViewportAnchor(k);
      if (!a) return;
      const last = lastAnchor.current;
      const nearlySame =
        last &&
        Math.abs(last.left - a.left) <= 2 &&
        Math.abs(last.top - a.top) <= 2 &&
        Math.abs(last.width - a.width) <= 2;
      if (!nearlySame) {
        lastAnchor.current = a;
        setAnchor(a);
      }
      setOpenMenu(k);
    }, 80);
  };

  // Use composedPath()/path for robust outside-click detection. Hook listens on pointerdown for single-click close.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      // Get composed path (works with web components & shadow DOM); fallback to e.target
      let path: EventTarget[] = [];
      if (typeof (e as any).composedPath === "function") {
        path = (e as any).composedPath();
      } else if ((e as any).path) {
        path = (e as any).path;
      } else if (e.target) {
        path = [e.target];
      }

      // If dropdown contains any node in path -> it's an inside click
      if (
        dropdownRef.current &&
        path.some(
          (n) =>
            n === dropdownRef.current ||
            (n instanceof Node && dropdownRef.current!.contains(n as Node)),
        )
      ) {
        return;
      }

      // If a label button is in path -> allow label click to handle toggling; don't auto-close here
      const labelButtons = Object.values(labelRefs)
        .map((r) => r.current)
        .filter(Boolean) as HTMLElement[];
      if (
        labelButtons.some((btn) =>
          path.some(
            (n) => n === btn || (n instanceof Node && btn.contains(n as Node)),
          ),
        )
      ) {
        return;
      }

      // If click is inside topbar (but not on label), close immediately
      if (
        rootRef.current &&
        path.some(
          (n) =>
            n === rootRef.current ||
            (n instanceof Node && rootRef.current.contains(n as Node)),
        )
      ) {
        if (openMenu) {
          setOpenMenu(null);
          setAnchor(null);
          lastAnchor.current = null;
        }
        return;
      }

      // Click outside both topbar and dropdown -> close
      if (openMenu) {
        setOpenMenu(null);
        setAnchor(null);
        lastAnchor.current = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setAnchor(null);
        lastAnchor.current = null;
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    };
  }, [openMenu]);

  // Recompute anchor on resize/scroll so portal stays aligned to the label
  useEffect(() => {
    function onUpdate() {
      if (!openMenu) return;
      const k = openMenu as Exclude<MenuKey, null>;
      const a = computeViewportAnchor(k);
      if (a) {
        lastAnchor.current = a;
        setAnchor(a);
      }
    }
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, true);
    return () => {
      window.removeEventListener("resize", onUpdate);
      window.removeEventListener("scroll", onUpdate, true);
    };
  }, [openMenu]);

  // suppress native contextmenu on topbar (right-click inert)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handler = (e: MouseEvent) => {
      if (e.target instanceof Node && root.contains(e.target))
        e.preventDefault();
    };
    root.addEventListener("contextmenu", handler);
    return () => root.removeEventListener("contextmenu", handler);
  }, []);

  // Portal-rendered dropdown anchored using viewport coords (fixed)
  const DropdownPortal: React.FC<{
    anchor: { left: number; top: number; width: number };
    menu: Exclude<MenuKey, null>;
  }> = ({ anchor, menu }) => {
    if (typeof document === "undefined") return null;
    const items = MENU_ITEMS[menu];

    const viewportWidth = document.documentElement.clientWidth;
    const maxWidth = 360;
    const minWidth = 160;
    const computedWidth = Math.min(
      maxWidth,
      Math.max(minWidth, Math.round(anchor.width * 1.25)),
    );
    let left = anchor.left;
    if (left + computedWidth > viewportWidth - 8)
      left = Math.max(8, viewportWidth - 8 - computedWidth);

    const style: React.CSSProperties = {
      position: "fixed",
      left,
      top: anchor.top + 6,
      width: computedWidth,
      zIndex: 9999,
    };

    const node = (
      <div
        ref={dropdownRef}
        style={style}
        className="bg-white border rounded-md shadow-lg text-sm text-gray-800"
        role="menu"
        aria-label={`${menu} menu`}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-600">
          {menu.charAt(0).toUpperCase() + menu.slice(1)}
        </div>
        <div className="border-t" />
        <ul className="max-h-64 overflow-auto" role="none">
          {items.map((it, idx) => (
            <li
              key={idx}
              role="menuitem"
              tabIndex={0}
              onClick={() => {
                it.action?.();
                setOpenMenu(null);
                setAnchor(null);
                lastAnchor.current = null;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  it.action?.();
                  setOpenMenu(null);
                  setAnchor(null);
                  lastAnchor.current = null;
                }
              }}
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer select-none"
            >
              <span>{it.label}</span>
              {it.shortcut ? (
                <span className="text-xs text-gray-500">{it.shortcut}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );

    return createPortal(node, document.body);
  };

  return (
    <header
      ref={rootRef}
      className="w-full h-12 bg-gray-200 flex items-center justify-between px-16 border-b relative select-none"
    >
      <nav className="flex items-center gap-1 relative z-10">
        <div className="flex items-center gap-1">
          <button
            ref={labelRefs.file}
            onClick={(e) => {
              if (e.button === 0) toggleMenu("file");
            }}
            onMouseEnter={() => hoverSwitch("file")}
            className={`px-3 py-1 rounded text-sm ${openMenu === "file" ? "bg-gray-300" : "hover:bg-gray-300"}`}
            aria-haspopup="true"
            aria-expanded={openMenu === "file"}
          >
            File
          </button>

          <button
            ref={labelRefs.edit}
            onClick={(e) => {
              if (e.button === 0) toggleMenu("edit");
            }}
            onMouseEnter={() => hoverSwitch("edit")}
            className={`px-3 py-1 rounded text-sm ${openMenu === "edit" ? "bg-gray-300" : "hover:bg-gray-300"}`}
            aria-haspopup="true"
            aria-expanded={openMenu === "edit"}
          >
            Edit
          </button>

          <button
            ref={labelRefs.view}
            onClick={(e) => {
              if (e.button === 0) toggleMenu("view");
            }}
            onMouseEnter={() => hoverSwitch("view")}
            className={`px-3 py-1 rounded text-sm ${openMenu === "view" ? "bg-gray-300" : "hover:bg-gray-300"}`}
            aria-haspopup="true"
            aria-expanded={openMenu === "view"}
          >
            View
          </button>

          <button
            ref={labelRefs.help}
            onClick={(e) => {
              if (e.button === 0) toggleMenu("help");
            }}
            onMouseEnter={() => hoverSwitch("help")}
            className={`px-3 py-1 rounded text-sm ${openMenu === "help" ? "bg-gray-300" : "hover:bg-gray-300"}`}
            aria-haspopup="true"
            aria-expanded={openMenu === "help"}
          >
            Help
          </button>
        </div>

        {/* portal dropdown */}
        {openMenu && anchor ? (
          <DropdownPortal
            anchor={anchor}
            menu={openMenu as Exclude<MenuKey, null>}
          />
        ) : null}
      </nav>

      <div className="text-sm text-muted-foreground">
        Gollaboratex Playground
      </div>

      <div className="flex items-center gap-3 text-gray-500">
        {"Have a nice day!"}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {""}
        </div>
      </div>
    </header>
  );
}
