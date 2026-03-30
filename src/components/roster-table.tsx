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
	const posMap = new Map(positions.map((p) => [p.id, p]));
	const shiftMap = new Map(shifts.map((s) => [s.id, s]));

	// Generate date columns
	const dates: string[] = [];
	let current = new Date(startDate);
	for (let i = 0; i < 7; i++) {
		dates.push(format(current, "yyyy-MM-dd"));
		current = addDays(current, 1);
	}

	// Build assignment lookup: employeeId -> date -> assignment
	const assignmentByEmpDate = new Map<string, Map<string, RosterAssignment>>();
	for (const a of assignments) {
		if (!assignmentByEmpDate.has(a.employeeId)) {
			assignmentByEmpDate.set(a.employeeId, new Map());
		}
		assignmentByEmpDate.get(a.employeeId)!.set(a.date, a);
	}

	// Only show employees with assignments
	const activeEmployeeIds = new Set(assignments.map((a) => a.employeeId));
	const activeEmployees = employees.filter((e) => activeEmployeeIds.has(e.id));

	// Group by primary position
	const grouped = new Map<string, Employee[]>();
	for (const emp of activeEmployees) {
		const posId = emp.primaryPositionId ?? emp.positionIds[0] ?? "unknown";
		if (!grouped.has(posId)) grouped.set(posId, []);
		grouped.get(posId)!.push(emp);
	}

	// Sort employees within each group by name
	for (const group of grouped.values()) {
		group.sort((a, b) => a.firstName.localeCompare(b.firstName));
	}

	function getShiftInfo(assignment: RosterAssignment | undefined) {
		if (!assignment) return { time: "OFF", positionName: null, positionColor: null, isCross: false };
		const shift = shiftMap.get(assignment.shiftId);
		if (!shift) return { time: "?", positionName: null, positionColor: null, isCross: false };
		const date = new Date(assignment.date);
		const jsDay = date.getUTCDay();
		const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
		const schedule = shift.schedules.find((s) => s.dayOfWeek === dayOfWeek);
		if (!schedule) return { time: "?", positionName: null, positionColor: null, isCross: false };
		const pos = posMap.get(shift.positionId);
		return {
			time: `${schedule.startTime.slice(0, 5)} - ${schedule.endTime.slice(0, 5)}`,
			positionName: pos?.name ?? null,
			positionColor: pos?.color ?? null,
			isCross: true,
		};
	}

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
						<th className="p-2 text-left font-medium">Position</th>
						<th className="p-2 text-left font-medium">Employee</th>
						{dates.map((date, i) => (
							<th key={date} className="p-2 text-center font-medium min-w-[120px]">
								<div>{DAYS[i]}</div>
								<div className="text-xs text-muted-foreground">
									{format(new Date(date), "dd/MM/yyyy")}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from(grouped.entries()).map(([posId, groupEmployees]) => {
						const pos = posMap.get(posId);
						return groupEmployees.map((emp, empIdx) => (
							<tr key={emp.id} className="border-b">
								{empIdx === 0 && (
									<td
										rowSpan={groupEmployees.length}
										className="p-2 font-medium align-middle border-r bg-muted/20"
									>
										<div className="flex items-center gap-1.5">
											{pos && (
												<div
													className="h-2.5 w-2.5 rounded-full shrink-0"
													style={{ backgroundColor: pos.color }}
												/>
											)}
											{pos?.name ?? "Unknown"}
										</div>
									</td>
								)}
								<td className="p-2 font-medium border-r whitespace-nowrap">
									{emp.firstName} {emp.lastName}
								</td>
								{dates.map((date) => {
									const empAssignments = assignmentByEmpDate.get(emp.id);
									const assignment = empAssignments?.get(date);
									const info = getShiftInfo(assignment);
									const isOff = info.time === "OFF";
									const shift = assignment ? shiftMap.get(assignment.shiftId) : null;
									const isOtherPosition = shift ? shift.positionId !== posId : false;
									return (
										<td
											key={date}
											className={`p-2 text-center border-r text-xs ${
												isOff
													? "bg-muted/30 text-muted-foreground"
													: "font-medium"
											} ${onCellClick ? "cursor-pointer hover:bg-accent" : ""}`}
											onClick={() =>
												onCellClick?.(
													date,
													assignment?.shiftId ?? "",
													assignment?.employeeId,
												)
											}
										>
											<div>{info.time}</div>
											{isOtherPosition && info.positionName && (
												<div
													className="text-[10px] mt-0.5 font-normal"
													style={{ color: info.positionColor ?? undefined }}
												>
													{info.positionName}
												</div>
											)}
										</td>
									);
								})}
							</tr>
						));
					})}
				</tbody>
			</table>
		</div>
	);
}
