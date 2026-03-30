import type { Employee, RosterAssignment, Shift } from "./types";
import { getEmployeeHours } from "./constraints";

/**
 * Score an employee for a slot (higher = better candidate).
 */
export function scoreEmployee(
	employee: Employee,
	shiftId: string,
	assignments: RosterAssignment[],
	shifts: Shift[],
	allEmployeeIds: string[],
	previousAssignments: RosterAssignment[],
): number {
	const shiftMap = new Map(shifts.map((s) => [s.id, s]));
	const shift = shiftMap.get(shiftId);

	// 1. Primary position: flat bonus — primary always beats secondary
	const isPrimary = shift && employee.primaryPositionId === shift.positionId;
	const primaryBonus = isPrimary ? 100 : 0;

	// 2. Hours remaining: main factor within the same tier
	//    Employees with more remaining capacity score higher (range ~0-10)
	const currentHours = getEmployeeHours(employee.id, assignments, shifts);
	const remainingRatio = Math.max(0, (employee.maxHoursPerWeek - currentHours) / employee.maxHoursPerWeek);
	const hoursScore = remainingRatio * 10;

	// 3. Consistency: small tiebreaker — prefer keeping same shift across the week
	const sameShiftCount = assignments.filter(
		(a) => a.employeeId === employee.id && a.shiftId === shiftId,
	).length;
	const consistencyBonus = sameShiftCount * 0.5;

	// 4. Previous roster penalty
	const hadSameShiftLastWeek = previousAssignments.some(
		(a) => a.employeeId === employee.id && a.shiftId === shiftId,
	);
	const previousRosterPenalty = hadSameShiftLastWeek ? -0.3 : 0;

	return (
		primaryBonus +
		hoursScore +
		consistencyBonus +
		previousRosterPenalty
	);
}
