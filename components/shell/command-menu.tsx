"use client";

import { Calendar, ChartLine, LayoutGrid, ListChecks, Plus, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { ProjectIconTile } from "@/components/ui/project-icon";
import { useMembers, useProjects, useTasks } from "@/lib/queries";
import { useUiStore } from "@/store/ui";

const destinations = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/team", label: "Team", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** ⌘K palette: projects, tasks, people and navigation in one keystroke. */
export function CommandMenu() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const openMember = useUiStore((state) => state.openMember);
  const [query, setQuery] = useState("");
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const match = (value: string) => value.toLowerCase().includes(term);
    return {
      projects: projects.filter((project) => {
        if (!term) return true;
        if (match(project.name) || match(project.owner)) return true;
        return (project.owners ?? []).some((owner) => match(owner));
      }),
      tasks: tasks.filter((task) => !term || match(task.title) || match(task.assignee)).slice(0, 6),
      people: members.filter((member) => !term || match(member.name) || match(member.role)),
    };
  }, [query, projects, tasks, members]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Nada encontrado por aqui.</CommandEmpty>

        <CommandGroup heading="Ir para">
          {destinations.map((destination) => (
            <CommandItem
              key={destination.href}
              value={`ir para ${destination.label}`}
              onSelect={() => go(destination.href)}
            >
              <destination.icon className="size-4 text-ink-faint" aria-hidden />
              {destination.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {filtered.projects.length > 0 ? (
          <CommandGroup heading="Projetos">
            {filtered.projects.slice(0, 5).map((project) => {
              const displayOwners = project.owners?.length
                ? project.owners.join(", ")
                : project.owner;

              return (
                <CommandItem
                  key={project.id}
                  value={`projeto ${project.name} ${displayOwners}`}
                  onSelect={() => go("/dashboard")}
                >
                  <ProjectIconTile
                    icon={project.icon}
                    color={project.color}
                    size="sm"
                    className="size-5 rounded-[7px] [&_svg]:size-3"
                  />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="truncate text-[11.5px] text-ink-faint">{displayOwners}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {filtered.tasks.length > 0 ? (
          <CommandGroup heading="Tarefas">
            {filtered.tasks.map((task) => (
              <CommandItem key={task.id} value={`tarefa ${task.title}`} onSelect={() => go("/tasks")}>
                <ListChecks className="size-4 text-ink-faint" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                <span className="truncate text-[11.5px] text-ink-faint">{task.assignee}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {filtered.people.length > 0 ? (
          <CommandGroup heading="Pessoas">
            {filtered.people.map((member) => (
              <CommandItem
                key={member.id}
                value={`pessoa ${member.name}`}
                onSelect={() => {
                  setOpen(false);
                  router.push("/team");
                  openMember(member.id);
                }}
              >
                <InitialsAvatar name={member.name} color={member.color} size="xs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
                <span className="truncate text-[11.5px] text-ink-faint">{member.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Ações">
          <CommandItem
            value="criar novo projeto"
            onSelect={() => {
              setOpen(false);
              toast("Novo projeto", { description: "O fluxo de criação chega na próxima versão." });
            }}
          >
            <Plus className="size-4 text-ink-faint" aria-hidden />
            Novo projeto
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
