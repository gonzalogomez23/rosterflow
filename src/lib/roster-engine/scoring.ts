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
	const weights = {
		hoursFairness: 0.5,
		rotationPenalty: 0.3,
		previousRosterPenalty: 0.15,
		jitter: 0.05,
	};

	// Hours fairness: prioritize employees with fewer assigned hours
	const currentHours = getEmployeeHours(employee.id, assignments, shifts);
	const maxPossibleHours = Math.max(
		...allEmployeeIds.map((id) =>
			getEmployeeHours(id, assignments, shifts),
		),
		1,
	);
	const hoursFairness = 1 - currentHours / (maxPossibleHours + 1);

	// Rotation penalty: penalize if employee has done this shift a lot
	const sameShiftCount = assignments.filter(
		(a) => a.employeeId === employee.id && a.shiftId === shiftId,
	).length;
	const totalAssignments = assignments.filter(
		(a) => a.employeeId === employee.id,
	).length;
	const rotationPenalty =
		totalAssignments > 0 ? 1 - sameShiftCount / (totalAssignments + 1) : 1;

	// Previous roster penalty: penalize if they had the same shift last week
	const hadSameShiftLastWeek = previousAssignments.some(
		(a) => a.employeeId === employee.id && a.shiftId === shiftId,
	);
	const previousRosterPenalty = hadSameShiftLastWeek ? 0.3 : 1;

	// Random jitter for variety
	const jitter = Math.random();

	return (
		weights.hoursFairness * hoursFairness +
		weights.rotationPenalty * rotationPenalty +
		weights.previousRosterPenalty * previousRosterPenalty +
		weights.jitter * jitter
	);
}
