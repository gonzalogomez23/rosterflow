import { addDays, format, getDay } from "date-fns";
import type {
	GenerateInput,
	RosterAssignment,
	RosterResult,
	Slot,
} from "./types";
import {
	hasPosition,
	hasShiftOnDate,
	isAvailable,
	wouldExceedMaxHours,
	getEmployeeHours,
} from "./constraints";
import { scoreEmployee } from "./scoring";

/**
 * Convert JS getDay (0=Sun) to our dayOfWeek (0=Mon).
 */
function toDayOfWeek(jsDay: number): number {
	return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Generate a roster using a greedy weighted algorithm.
 */
export function generateRoster(input: GenerateInput): RosterResult {
	const {
		startDate,
		endDate,
		employees,
		shifts,
		positions,
		previousAssignments = [],
	} = input;

	const shiftMap = new Map(shifts.map((s) => [s.id, s]));
	const assignments: RosterAssignment[] = [];
	const warnings: string[] = [];

	// Step 1: Build all slots from shifts and their schedules
	const slots: Slot[] = [];
	let current = new Date(startDate);
	const end = new Date(endDate);

	while (current <= end) {
		const dateStr = format(current, "yyyy-MM-dd");
		const dayOfWeek = toDayOfWeek(getDay(current));

		for (const shift of shifts) {
			for (const schedule of shift.schedules) {
				if (schedule.dayOfWeek !== dayOfWeek) continue;
				for (let i = 0; i < schedule.count; i++) {
					slots.push({
						date: dateStr,
						dayOfWeek,
						shiftId: shift.id,
						startTime: schedule.startTime,
						endTime: schedule.endTime,
					});
				}
			}
		}
		current = addDays(current, 1);
	}

	const allEmployeeIds = employees.map((e) => e.id);

	// Build a map of how many slots each position needs per date
	const positionDemand = new Map<string, number>();
	for (const slot of slots) {
		const shift = shiftMap.get(slot.shiftId)!;
		const key = `${shift.positionId}:${slot.date}`;
		positionDemand.set(key, (positionDemand.get(key) ?? 0) + 1);
	}

	// Count how many primary employees are available for a position on a date
	function primarySupply(positionId: string, date: string, dayOfWeek: number): number {
		return employees.filter((e) =>
			e.primaryPositionId === positionId &&
			e.availability.some((a) => a.dayOfWeek === dayOfWeek),
		).length;
	}

	// Check if an employee is "needed" by another position on a given date
	// (i.e., that position has more demand than primary supply)
	function neededElsewhere(employee: Employee, date: string, dayOfWeek: number, excludePositionId: string): boolean {
		for (const posId of employee.positionIds) {
			if (posId === excludePositionId) continue;
			const key = `${posId}:${date}`;
			const demand = positionDemand.get(key) ?? 0;
			if (demand === 0) continue;
			const supply = primarySupply(posId, date, dayOfWeek);
			if (supply < demand) return true;
		}
		return false;
	}

	function assignSlot(slot: Slot, primaryOnly: boolean): boolean {
		const shift = shiftMap.get(slot.shiftId)!;

		const candidates = employees.filter((e) => {
			if (!hasPosition(e, shift.positionId)) return false;
			if (!isAvailable(e, slot)) return false;
			if (hasShiftOnDate(e.id, slot.date, assignments)) return false;
			if (wouldExceedMaxHours(e, slot, assignments, shifts)) return false;
			if (primaryOnly && e.primaryPositionId !== shift.positionId) return false;
			return true;
		});

		if (candidates.length === 0) return false;

		// In primary pass, avoid using employees that are needed elsewhere as secondary
		const preferred = primaryOnly
			? candidates.filter((e) => !neededElsewhere(e, slot.date, slot.dayOfWeek, shift.positionId))
			: candidates;
		const pool = preferred.length > 0 ? preferred : candidates;

		const scored = pool.map((e) => ({
			employee: e,
			score: scoreEmployee(e, slot.shiftId, assignments, shifts, allEmployeeIds, previousAssignments),
		}));
		scored.sort((a, b) => b.score - a.score);

		assignments.push({
			employeeId: scored[0].employee.id,
			shiftId: slot.shiftId,
			date: slot.date,
		});
		return true;
	}

	// Sort slots: fewer eligible candidates first (hardest to fill)
	function sortByDifficulty(slotsToSort: Slot[], primaryOnly: boolean) {
		return [...slotsToSort].sort((a, b) => {
			const shiftA = shiftMap.get(a.shiftId)!;
			const shiftB = shiftMap.get(b.shiftId)!;
			const eligibleA = employees.filter((e) =>
				hasPosition(e, shiftA.positionId) &&
				isAvailable(e, a) &&
				(!primaryOnly || e.primaryPositionId === shiftA.positionId),
			).length;
			const eligibleB = employees.filter((e) =>
				hasPosition(e, shiftB.positionId) &&
				isAvailable(e, b) &&
				(!primaryOnly || e.primaryPositionId === shiftB.positionId),
			).length;
			return eligibleA - eligibleB;
		});
	}

	// Pass 1: Fill slots with primary-position employees only
	const sortedPrimary = sortByDifficulty(slots, true);
	const unfilled: Slot[] = [];
	for (const slot of sortedPrimary) {
		if (!assignSlot(slot, true)) {
			unfilled.push(slot);
		}
	}

	// Pass 2: Fill remaining slots with any eligible employee
	const sortedRemaining = sortByDifficulty(unfilled, false);
	for (const slot of sortedRemaining) {
		if (!assignSlot(slot, false)) {
			const shift = shiftMap.get(slot.shiftId)!;
			const pos = positions.find((p) => p.id === shift.positionId);
			warnings.push(
				`No available employee for ${pos?.name ?? "Unknown"} on ${slot.date.split("-").reverse().join("/")} (${shift.name})`,
			);
		}
	}

	// Step 5: Build stats
	const employeeHours: Record<string, number> = {};
	for (const emp of employees) {
		employeeHours[emp.id] = getEmployeeHours(emp.id, assignments, shifts);
	}

	return {
		assignments,
		warnings,
		stats: {
			totalSlots: slots.length,
			filledSlots: assignments.length,
			employeeHours,
		},
	};
}
