"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CommandDialog({
  open,
  onOpenChange,
  children,
  label = "Busca rápida",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-[560px] translate-y-0 gap-0 overflow-hidden rounded-[22px] border-line bg-surface p-0 shadow-[var(--shadow-pop)] sm:max-w-[560px]"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">
          Busque por projetos, tarefas, pessoas ou navegue pelo Frenly.
        </DialogDescription>
        <CommandPrimitive className="flex h-full w-full flex-col" loop>
          {children}
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

export function CommandInput({
  placeholder = "Buscar projetos, tarefas, pessoas…",
  value,
  onValueChange,
}: {
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4">
      <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
      <CommandPrimitive.Input
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
      />
      <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
        ESC
      </kbd>
    </div>
  );
}

export function CommandList({ children }: { children: React.ReactNode }) {
  return (
    <CommandPrimitive.List className="max-h-[380px] overflow-y-auto overscroll-contain p-2">
      {children}
    </CommandPrimitive.List>
  );
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return (
    <CommandPrimitive.Empty className="px-3 py-8 text-center text-[13px] text-ink-soft">
      {children}
    </CommandPrimitive.Empty>
  );
}

export function CommandGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <CommandPrimitive.Group
      heading={heading}
      className={cn(
        "px-1 py-1 text-ink [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5",
        "[&_[cmdk-group-heading]]:label-section",
      )}
    >
      {children}
    </CommandPrimitive.Group>
  );
}

export function CommandItem({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <CommandPrimitive.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[13px] text-ink-soft outline-none select-none",
        "data-[selected=true]:bg-surface-muted data-[selected=true]:text-ink",
      )}
    >
      {children}
    </CommandPrimitive.Item>
  );
}
