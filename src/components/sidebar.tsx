"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Users,
	Briefcase,
	CalendarDays,
	LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/employees", label: "Employees", icon: Users },
	{ href: "/dashboard/positions", label: "Positions", icon: Briefcase },
	{ href: "/dashboard/rosters", label: "Rosters", icon: CalendarDays },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
			<div className="flex h-14 items-center border-b border-sidebar-border px-4">
				<Link href="/dashboard">
					<Image src="/logo/horizontal-primary.svg" alt="RosterFlow" width={160} height={30} priority />
				</Link>
			</div>
			<nav className="flex-1 space-y-1 p-2">
				{navItems.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.href !== "/dashboard" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"font-outfit flex items-center gap-3 rounded-md px-3 py-2 font-medium tracking-wide transition-colors",
								isActive
									? "bg-sidebar-accent text-sidebar-accent-foreground"
									: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="border-t border-sidebar-border p-2">
				<form action={logout}>
					<Button
						type="submit"
						variant="ghost"
						className="w-full justify-start gap-3 text-sidebar-foreground/70"
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</form>
			</div>
		</aside>
	);
}
