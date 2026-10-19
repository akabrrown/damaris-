'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, ExternalLink, X as CloseIcon } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url?: string;
  excerpt?: string;
}

export function ShareButton({ title, url, excerpt }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shareUrl && typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [shareUrl]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleCopyLink = async () => {
    const finalUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    const finalUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt || title,
          url: finalUrl,
        });
        setOpen(false);
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setOpen(true);
        }
      }
    } else {
      setOpen(true);
    }
  };

  const currentUrl = shareUrl || '';
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(`"${title}" — read this piece:\n${currentUrl}`);

  const shareTargets = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${shareText}`,
      color: 'hover:text-emerald-700',
    },
    {
      name: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'hover:text-sky-600',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:text-indigo-600',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`I thought you would appreciate reading "${title}":\n\n${currentUrl}`)}`,
      color: 'hover:text-ink',
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 text-sm font-medium text-moss hover:text-ink py-2 px-3 border border-line bg-paper hover:bg-paper-deep transition-colors cursor-pointer select-none"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Share ${title}`}
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        <span>Share this piece</span>
      </button>

      {/* Share Popover / Dropdown Menu */}
      {open && (
        <div
          role="dialog"
          aria-label="Share options"
          className="absolute left-0 bottom-full sm:bottom-auto sm:top-full mt-2 mb-2 w-72 p-4 bg-paper border border-ink shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
            <span className="font-serif text-sm font-medium text-ink">
              Share piece
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-ink p-1 cursor-pointer"
              aria-label="Close share menu"
            >
              <CloseIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Quick Copy Link Option */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between p-2.5 mb-3 bg-paper-deep border border-line hover:border-moss text-ink text-xs font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {copied ? (
                <Check className="w-4 h-4 text-moss" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4 text-muted" aria-hidden="true" />
              )}
              <span>{copied ? 'Link copied!' : 'Copy direct link'}</span>
            </div>
            {copied && <span className="text-[10px] text-moss uppercase tracking-wider">Copied</span>}
          </button>

          {/* Share Destinations List */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted font-mono mb-1.5">
              Send directly
            </p>
            {shareTargets.map((target) => (
              <a
                key={target.name}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between py-1.5 px-2 text-xs text-ink/80 hover:bg-paper-deep transition-colors ${target.color}`}
              >
                <span>{target.name}</span>
                <ExternalLink className="w-3 h-3 opacity-40" aria-hidden="true" />
              </a>
            ))}

            {/* Native device share option if supported */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full mt-2 pt-2 border-t border-line text-left flex items-center justify-between py-1.5 px-2 text-xs text-moss hover:bg-paper-deep cursor-pointer"
              >
                <span>Device share sheet…</span>
                <Share2 className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
