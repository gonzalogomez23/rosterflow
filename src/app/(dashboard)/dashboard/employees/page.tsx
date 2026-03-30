import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getEmployees } from "@/actions/employees";
import { getPositions } from "@/actions/positions";

export default async function EmployeesPage() {
	const [employees, positions] = await Promise.all([
		getEmployees(),
		getPositions(),
	]);

	const posMap = new Map(positions.map((p) => [p.id, p]));

	const sortedEmployees = [...employees].sort((a, b) => {
		const aPrimary = a.employee_positions.find((ep: { is_primary: boolean }) => ep.is_primary)?.position_id;
		const bPrimary = b.employee_positions.find((ep: { is_primary: boolean }) => ep.is_primary)?.position_id;
		const aName = posMap.get(aPrimary ?? "")?.name ?? "zzz";
		const bName = posMap.get(bPrimary ?? "")?.name ?? "zzz";
		return aName.localeCompare(bName) || a.first_name.localeCompare(b.first_name);
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader title="Employees" description="Manage your team members" />
				<Button asChild>
					<Link href="/dashboard/employees/new">
						<Plus className="h-4 w-4" />
						Add Employee
					</Link>
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Max Hours</TableHead>
						<TableHead>Positions</TableHead>
						<TableHead className="w-20">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedEmployees.map((emp) => (
						<TableRow key={emp.id}>
							<TableCell className="font-medium">
								{emp.first_name} {emp.last_name}
							</TableCell>
							<TableCell>{emp.max_hours_per_week}h</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{[...emp.employee_positions].sort((a: { is_primary: boolean }, b: { is_primary: boolean }) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((ep: { position_id: string; is_primary: boolean }) => {
										const pos = posMap.get(ep.position_id);
										return pos ? (
											<Badge
												key={ep.position_id}
												variant="secondary"
												style={
													ep.is_primary
														? { backgroundColor: pos.color, color: "white", borderColor: pos.color }
														: { backgroundColor: `${pos.color}15`, borderColor: pos.color }
												}
											>
												{pos.name}
											</Badge>
										) : null;
									})}
								</div>
							</TableCell>
							<TableCell>
								<Button asChild size="sm" variant="outline">
									<Link href={`/dashboard/employees/${emp.id}`}>
										Edit
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
					{employees.length === 0 && (
						<TableRow>
							<TableCell colSpan={4} className="text-center text-muted-foreground">
								No employees yet.{" "}
								<Link href="/dashboard/employees/new" className="underline">
									Add one
								</Link>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
