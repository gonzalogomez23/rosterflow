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

	// Step 2: Sort slots by difficulty (fewer eligible candidates first)
	const slotDifficulty = slots.map((slot) => {
		const shift = shiftMap.get(slot.shiftId)!;
		const eligible = employees.filter(
			(e) =>
				hasPosition(e, shift.positionId) && isAvailable(e, slot),
		);
		return { slot, eligibleCount: eligible.length };
	});

	slotDifficulty.sort((a, b) => a.eligibleCount - b.eligibleCount);

	const allEmployeeIds = employees.map((e) => e.id);

	// Step 3 & 4: For each slot, score and assign
	for (const { slot } of slotDifficulty) {
		const shift = shiftMap.get(slot.shiftId)!;

		// Find eligible employees for this slot
		const candidates = employees.filter(
			(e) =>
				hasPosition(e, shift.positionId) &&
				isAvailable(e, slot) &&
				!hasShiftOnDate(e.id, slot.date, assignments) &&
				!wouldExceedMaxHours(e, slot, assignments, shifts),
		);

		if (candidates.length === 0) {
			const pos = positions.find((p) => p.id === shift.positionId);
			const posName = pos?.name ?? "Unknown";
			warnings.push(
				`No available employee for ${posName} on ${slot.date} (${shift.name})`,
			);
			continue;
		}

		// Score each candidate
		const scored = candidates.map((e) => ({
			employee: e,
			score: scoreEmployee(
				e,
				slot.shiftId,
				assignments,
				shifts,
				allEmployeeIds,
				previousAssignments,
			),
		}));

		scored.sort((a, b) => b.score - a.score);

		// Assign the best candidate
		const best = scored[0].employee;
		assignments.push({
			employeeId: best.id,
			shiftId: slot.shiftId,
			date: slot.date,
		});
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
