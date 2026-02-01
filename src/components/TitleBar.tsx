'use client';

import { useEffect, useState } from 'react';

declare global {
    interface Window {
        __TAURI__?: {
            window: {
                getCurrent: () => {
                    minimize: () => Promise<void>;
                    toggleMaximize: () => Promise<void>;
                    close: () => Promise<void>;
                    startDragging: () => Promise<void>;
                };
            };
        };
    }
}

export default function TitleBar() {
    const [isTauri, setIsTauri] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Check if running in Tauri
        setIsTauri(typeof window !== 'undefined' && !!window.__TAURI__);
    }, []);

    if (!isTauri) return null;

    const handleMinimize = async () => {
        const appWindow = window.__TAURI__?.window.getCurrent();
        await appWindow?.minimize();
    };

    const handleMaximize = async () => {
        const appWindow = window.__TAURI__?.window.getCurrent();
        await appWindow?.toggleMaximize();
        setIsMaximized(!isMaximized);
    };

    const handleClose = async () => {
        const appWindow = window.__TAURI__?.window.getCurrent();
        await appWindow?.close();
    };

    const handleDrag = async () => {
        const appWindow = window.__TAURI__?.window.getCurrent();
        await appWindow?.startDragging();
    };

    return (
        <div
            className="titlebar"
            data-tauri-drag-region
            onMouseDown={handleDrag}
        >
            <div className="titlebar-icon">
                🐱
            </div>
            <div className="titlebar-title">
                MeowTV
            </div>
            <div className="titlebar-spacer" />
            <div className="titlebar-buttons">
                <button
                    className="titlebar-button titlebar-button--minimize"
                    onClick={handleMinimize}
                    aria-label="Minimize"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect fill="currentColor" width="10" height="1" x="1" y="6" />
                    </svg>
                </button>
                <button
                    className="titlebar-button titlebar-button--maximize"
                    onClick={handleMaximize}
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect fill="none" stroke="currentColor" strokeWidth="1" width="7" height="7" x="2.5" y="2.5" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect fill="none" stroke="currentColor" strokeWidth="1" width="9" height="9" x="1.5" y="1.5" />
                        </svg>
                    )}
                </button>
                <button
                    className="titlebar-button titlebar-button--close"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <path fill="currentColor" d="M6.707 6l3.146-3.146a.5.5 0 0 0-.707-.708L6 5.293 2.854 2.146a.5.5 0 1 0-.708.708L5.293 6l-3.147 3.146a.5.5 0 0 0 .708.708L6 6.707l3.146 3.147a.5.5 0 0 0 .708-.708L6.707 6z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
