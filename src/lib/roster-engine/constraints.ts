import type {
	Employee,
	RosterAssignment,
	Shift,
	Slot,
} from "./types";

/**
 * Calculate the duration in hours from start/end time strings.
 */
export function shiftDurationHours(startTime: string, endTime: string): number {
	const [sh, sm] = startTime.split(":").map(Number);
	const [eh, em] = endTime.split(":").map(Number);
	let start = sh * 60 + sm;
	let end = eh * 60 + em;
	// Handle overnight shifts
	if (end <= start) end += 24 * 60;
	return (end - start) / 60;
}

/**
 * Check if an employee is available for a given slot.
 * Slot carries its own start/end time from the day-specific schedule.
 */
export function isAvailable(
	employee: Employee,
	slot: Slot,
): boolean {
	return employee.availability.some(
		(a) =>
			a.dayOfWeek === slot.dayOfWeek &&
			a.startTime <= slot.startTime &&
			a.endTime >= slot.endTime,
	);
}

/**
 * Check if an employee has the required position.
 */
export function hasPosition(employee: Employee, positionId: string): boolean {
	return employee.positionIds.includes(positionId);
}

/**
 * Check if an employee already has a shift on the given date.
 */
export function hasShiftOnDate(
	employeeId: string,
	date: string,
	assignments: RosterAssignment[],
): boolean {
	return assignments.some(
		(a) => a.employeeId === employeeId && a.date === date,
	);
}

/**
 * Calculate total hours assigned to an employee.
 */
export function getEmployeeHours(
	employeeId: string,
	assignments: RosterAssignment[],
	shifts: Shift[],
): number {
	const shiftMap = new Map(shifts.map((s) => [s.id, s]));
	return assignments
		.filter((a) => a.employeeId === employeeId)
		.reduce((total, a) => {
			const shift = shiftMap.get(a.shiftId);
			if (!shift) return total;
			// Find the schedule for this assignment's date's day of week
			// We need to derive dayOfWeek from the date
			const date = new Date(a.date);
			const jsDay = date.getUTCDay();
			const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
			const schedule = shift.schedules.find((s) => s.dayOfWeek === dayOfWeek);
			if (!schedule) return total;
			return total + shiftDurationHours(schedule.startTime, schedule.endTime);
		}, 0);
}

/**
 * Check if adding a shift would exceed the employee's max hours.
 */
export function wouldExceedMaxHours(
	employee: Employee,
	slot: Slot,
	assignments: RosterAssignment[],
	shifts: Shift[],
): boolean {
	const currentHours = getEmployeeHours(employee.id, assignments, shifts);
	return currentHours + shiftDurationHours(slot.startTime, slot.endTime) > employee.maxHoursPerWeek;
}
