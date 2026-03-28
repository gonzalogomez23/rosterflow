"use client";

import { addDays, format } from "date-fns";
import type {
	Employee,
	Position,
	RosterAssignment,
	Shift,
} from "@/lib/roster-engine/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
	assignments: RosterAssignment[];
	employees: Employee[];
	shifts: Shift[];
	positions: Position[];
	startDate: string;
	endDate: string;
	onCellClick?: (
		date: string,
		shiftId: string,
		currentEmployeeId?: string,
	) => void;
}

export function RosterTable({
	assignments,
	employees,
	shifts,
	positions,
	startDate,
	onCellClick,
}: Props) {
	const empMap = new Map(employees.map((e) => [e.id, e]));
	const posMap = new Map(positions.map((p) => [p.id, p]));

	// Generate date columns
	const dates: string[] = [];
	let current = new Date(startDate);
	for (let i = 0; i < 7; i++) {
		dates.push(format(current, "yyyy-MM-dd"));
		current = addDays(current, 1);
	}

	function getAssignmentsForShift(shiftId: string, date: string) {
		return assignments.filter(
			(a) => a.shiftId === shiftId && a.date === date,
		);
	}

	// Only show shifts that have assignments
	const activeShifts = shifts.filter((s) =>
		assignments.some((a) => a.shiftId === s.id),
	);

	if (assignments.length === 0) {
		return (
			<p className="text-center text-muted-foreground py-8">
				No assignments generated.
			</p>
		);
	}

	return (
		<div className="overflow-auto rounded-lg border">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/50">
						<th className="p-2 text-left font-medium">Shift</th>
						<th className="p-2 text-left font-medium">Position</th>
						{dates.map((date, i) => (
							<th key={date} className="p-2 text-center font-medium min-w-[100px]">
								<div>{DAYS[i]}</div>
								<div className="text-xs text-muted-foreground">
									{format(new Date(date), "MMM d")}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{activeShifts.map((shift) => {
						const pos = posMap.get(shift.positionId);
						return (
							<tr key={shift.id} className="border-b">
								<td className="p-2 font-medium align-top border-r">
									<div>{shift.name}</div>
								</td>
								<td className="p-2 border-r">
									<div className="flex items-center gap-1.5">
										{pos && (
											<div
												className="h-2.5 w-2.5 rounded-full"
												style={{ backgroundColor: pos.color }}
											/>
										)}
										{pos?.name ?? "Unknown"}
									</div>
								</td>
								{dates.map((date) => {
									const dayAssignments = getAssignmentsForShift(shift.id, date);

									return (
										<td
											key={date}
											className={`p-2 text-center border-r ${
												onCellClick
													? "cursor-pointer hover:bg-accent"
													: ""
											} ${dayAssignments.length === 0 ? "bg-muted/30" : ""}`}
											onClick={() =>
												onCellClick?.(
													date,
													shift.id,
													dayAssignments[0]?.employeeId,
												)
											}
										>
											{dayAssignments.length > 0 ? (
												dayAssignments.map((assignment, i) => {
													const emp = empMap.get(assignment.employeeId);
													return (
														<div key={i} className="text-xs font-medium">
															{emp
																? `${emp.firstName} ${emp.lastName[0]}.`
																: "?"}
														</div>
													);
												})
											) : (
												<span className="text-xs text-muted-foreground">
													—
												</span>
											)}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
