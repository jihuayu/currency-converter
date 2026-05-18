'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Layers3 } from 'lucide-react';
import {
  defaultPackageIds,
  isDefaultPackageSelection,
  packages,
  type PackageId,
} from '@/lib/data';
import { cn } from '@/lib/utils';

interface MobileSubscriptionSwitcherProps {
  selectedPackages: PackageId[];
  onPackageChange: (packages: PackageId[]) => void;
}

export function MobileSubscriptionSwitcher({
  selectedPackages,
  onPackageChange,
}: MobileSubscriptionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (selectedPackages.length === 1) {
      return (
        packages.find((pkg) => pkg.id === selectedPackages[0])?.name ?? '选择订阅'
      );
    }

    if (isDefaultPackageSelection(selectedPackages)) {
      return '默认订阅';
    }

    if (selectedPackages.length === packages.length) {
      return '全部订阅';
    }

    return `${selectedPackages.length} 个订阅`;
  }, [selectedPackages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectPackages = (nextPackages: PackageId[]) => {
    onPackageChange(nextPackages);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="sticky top-3 z-30 mb-4 md:hidden">
      <div className="relative rounded-2xl border border-border bg-card/95 p-2 shadow-2xl shadow-background/40 backdrop-blur">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-secondary/70 px-4 py-3 text-left transition-colors hover:bg-secondary"
          aria-expanded={isOpen}
          aria-controls="mobile-subscription-options"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Layers3 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">快速切换订阅</span>
              <span className="block truncate font-medium text-foreground">
                {selectedLabel}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div
            id="mobile-subscription-options"
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-background/70"
          >
            <div className="max-h-[65vh] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => selectPackages(defaultPackageIds)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors',
                  isDefaultPackageSelection(selectedPackages)
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-secondary/70'
                )}
              >
                <span>
                  <span className="block font-medium">默认订阅</span>
                  <span className="text-xs text-muted-foreground">隐藏 100 单位测试金额</span>
                </span>
                {isDefaultPackageSelection(selectedPackages) && (
                  <Check className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => selectPackages(packages.map((pkg) => pkg.id))}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors',
                  selectedPackages.length === packages.length
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-secondary/70'
                )}
              >
                <span>
                  <span className="block font-medium">全部订阅</span>
                  <span className="text-xs text-muted-foreground">包含测试金额</span>
                </span>
                {selectedPackages.length === packages.length && (
                  <Check className="h-4 w-4" />
                )}
              </button>

              <div className="my-2 h-px bg-border" />

              {packages.map((pkg) => {
                const isSelected =
                  selectedPackages.length === 1 && selectedPackages[0] === pkg.id;

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => selectPackages([pkg.id])}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary/70'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {pkg.name}
                      </span>
                      <span
                        className={cn(
                          'block truncate text-xs',
                          isSelected
                            ? 'text-primary-foreground/75'
                            : 'text-muted-foreground'
                        )}
                      >
                        {pkg.description}
                      </span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
