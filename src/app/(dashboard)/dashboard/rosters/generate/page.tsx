"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfWeek } from "date-fns";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RosterTable } from "@/components/roster-table";
import { getEmployees } from "@/actions/employees";
import { getPositions } from "@/actions/positions";
import { getShifts } from "@/actions/shifts";
import { saveRoster } from "@/actions/rosters";
import { generateRoster } from "@/lib/roster-engine/generate";
import type {
	Employee,
	Position,
	Shift,
	RosterResult,
} from "@/lib/roster-engine/types";

export default function GenerateRosterPage() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	// Next Monday as default
	const nextMonday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });
	const [startDate, setStartDate] = useState(format(nextMonday, "yyyy-MM-dd"));
	const [endDate, setEndDate] = useState(
		format(addDays(nextMonday, 6), "yyyy-MM-dd"),
	);

	const [employees, setEmployees] = useState<Employee[]>([]);
	const [positions, setPositions] = useState<Position[]>([]);
	const [shifts, setShifts] = useState<Shift[]>([]);
	const [result, setResult] = useState<RosterResult | null>(null);

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		const [emps, pos, rawShifts] = await Promise.all([
			getEmployees(),
			getPositions(),
			getShifts(),
		]);

		setPositions(pos.map((p) => ({ id: p.id, name: p.name, color: p.color })));

		setShifts(
			rawShifts.map((s) => ({
				id: s.id,
				positionId: s.position_id,
				name: s.name,
				schedules: s.shift_schedules.map((ss) => ({
					dayOfWeek: ss.day_of_week,
					startTime: ss.start_time,
					endTime: ss.end_time,
					count: ss.count,
				})),
			})),
		);

		setEmployees(
			emps.map((e) => ({
				id: e.id,
				firstName: e.first_name,
				lastName: e.last_name,
				maxHoursPerWeek: e.max_hours_per_week,
				positionIds: e.employee_positions.map((ep) => ep.position_id),
				availability: e.employee_availability.map((a) => ({
					dayOfWeek: a.day_of_week,
					startTime: a.start_time,
					endTime: a.end_time,
				})),
			})),
		);
	}

	function handleGenerate() {
		const rosterResult = generateRoster({
			startDate,
			endDate,
			employees,
			shifts,
			positions,
		});
		setResult(rosterResult);
	}

	function handleSave() {
		if (!result) return;
		startTransition(async () => {
			const res = await saveRoster(startDate, endDate, result.assignments);
			if (res && "id" in res) {
				router.push(`/dashboard/rosters/${res.id}`);
			}
		});
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Generate Roster" description="Create a weekly schedule automatically" />

			{/* Date selection */}
			<Card>
				<CardHeader>
					<CardTitle>Week Range</CardTitle>
				</CardHeader>
				<CardContent className="flex gap-4 items-end">
					<div className="grid gap-2">
						<Label>Start Date (Monday)</Label>
						<Input
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setEndDate(
									format(addDays(new Date(e.target.value), 6), "yyyy-MM-dd"),
								);
							}}
						/>
					</div>
					<div className="grid gap-2">
						<Label>End Date (Sunday)</Label>
						<Input type="date" value={endDate} disabled />
					</div>
					<Button onClick={handleGenerate} disabled={employees.length === 0}>
						Generate
					</Button>
				</CardContent>
			</Card>

			{/* Warnings / preconditions */}
			{employees.length === 0 && (
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground">
							Add employees with positions and availability before generating.
						</p>
					</CardContent>
				</Card>
			)}

			{/* Result */}
			{result && (
				<>
					{/* Stats */}
					<div className="grid gap-4 sm:grid-cols-3">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-2">
									{result.stats.filledSlots === result.stats.totalSlots ? (
										<CheckCircle className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-yellow-500" />
									)}
									<span className="text-lg font-semibold">
										{result.stats.filledSlots}/{result.stats.totalSlots} slots
										filled
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-lg font-semibold">
									{result.assignments.length} assignments
								</div>
								<p className="text-sm text-muted-foreground">
									across {employees.length} employees
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-lg font-semibold">
									{result.warnings.length} warnings
								</div>
								{result.warnings.length > 0 && (
									<Badge variant="warning">Needs attention</Badge>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Warnings detail */}
					{result.warnings.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-yellow-500" />
									Warnings
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-1 text-sm">
									{result.warnings.map((w, i) => (
										<li key={i} className="text-muted-foreground">
											{w}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}

					{/* Roster table */}
					<RosterTable
						assignments={result.assignments}
						employees={employees}
						shifts={shifts}
						positions={positions}
						startDate={startDate}
						endDate={endDate}
					/>

					{/* Hours distribution */}
					<Card>
						<CardHeader>
							<CardTitle>Hours Distribution</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{employees
									.filter((e) => (result.stats.employeeHours[e.id] ?? 0) > 0)
									.sort(
										(a, b) =>
											(result.stats.employeeHours[b.id] ?? 0) -
											(result.stats.employeeHours[a.id] ?? 0),
									)
									.map((emp) => {
										const hours = result.stats.employeeHours[emp.id] ?? 0;
										const pct = (hours / emp.maxHoursPerWeek) * 100;
										return (
											<div key={emp.id} className="flex items-center gap-2">
												<span className="text-sm w-32 truncate">
													{emp.firstName} {emp.lastName}
												</span>
												<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-primary rounded-full"
														style={{
															width: `${Math.min(pct, 100)}%`,
														}}
													/>
												</div>
												<span className="text-xs text-muted-foreground w-16 text-right">
													{hours.toFixed(1)}/{emp.maxHoursPerWeek}h
												</span>
											</div>
										);
									})}
							</div>
						</CardContent>
					</Card>

					<div className="flex gap-2">
						<Button onClick={handleSave} disabled={pending}>
							{pending ? "Saving..." : "Save as Draft"}
						</Button>
						<Button variant="outline" onClick={handleGenerate}>
							Regenerate
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
