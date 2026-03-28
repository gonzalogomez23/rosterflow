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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader title="Employees" description="Manage your team members" />
				<Button asChild>
					<Link href="/dashboard/employees/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Employee
					</Link>
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Max Hours</TableHead>
						<TableHead>Positions</TableHead>
						<TableHead className="w-20">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{employees.map((emp) => (
						<TableRow key={emp.id}>
							<TableCell className="font-medium">
								{emp.first_name} {emp.last_name}
							</TableCell>
							<TableCell>{emp.email || "—"}</TableCell>
							<TableCell>{emp.max_hours_per_week}h</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{emp.employee_positions.map((ep) => {
										const pos = posMap.get(ep.position_id);
										return pos ? (
											<Badge
												key={ep.position_id}
												variant="secondary"
												style={{ borderColor: pos.color }}
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
							<TableCell colSpan={5} className="text-center text-muted-foreground">
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
