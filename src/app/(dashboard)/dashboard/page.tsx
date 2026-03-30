import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { Users, Briefcase, CalendarDays, Plus } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEmployees } from "@/actions/employees";
import { getPositions } from "@/actions/positions";
import { getShifts } from "@/actions/shifts";
import { getRosters } from "@/actions/rosters";

export default async function DashboardPage() {
	const [employees, positions, shifts, rosters] = await Promise.all([
		getEmployees(),
		getPositions(),
		getShifts(),
		getRosters(),
	]);

	const currentRoster = rosters.find((r) => r.status === "published");

	const stats = [
		{
			label: "Employees",
			value: employees.length,
			icon: Users,
			href: "/dashboard/employees",
		},
		{
			label: "Positions",
			value: positions.length,
			icon: Briefcase,
			href: "/dashboard/positions",
		},
		{
			label: "Shifts",
			value: shifts.length,
			icon: CalendarDays,
			href: "/dashboard/positions",
		},
		{
			label: "Rosters",
			value: rosters.length,
			icon: CalendarDays,
			href: "/dashboard/rosters",
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Dashboard"
				description="Overview of your organization"
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Link key={stat.label} href={stat.href}>
						<Card className="transition-colors hover:bg-accent">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium font-outfit">
									{stat.label}
								</CardTitle>
								<stat.icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stat.value}</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="font-outfit">Quick Actions</CardTitle>
						<CardDescription>Common tasks</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-2">
						<Button asChild variant="outline" className="justify-start">
							<Link href="/dashboard/rosters/generate">
								<Plus className="h-4 w-4" />
								Generate next week&apos;s roster
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link href="/dashboard/employees/new">
								<Plus className="h-4 w-4" />
								Add new employee
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-outfit">Current Roster</CardTitle>
						<CardDescription>
							{currentRoster
								? `${currentRoster.start_date} to ${currentRoster.end_date}`
								: "No published roster"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{currentRoster ? (
							<Button asChild variant="outline">
								<Link href={`/dashboard/rosters/${currentRoster.id}`}>
									View roster
								</Link>
							</Button>
						) : (
							<p className="text-sm text-muted-foreground">
								Generate and publish a roster to see it here.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
