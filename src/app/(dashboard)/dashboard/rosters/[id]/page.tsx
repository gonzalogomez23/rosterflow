import { notFound } from "next/navigation";
import { getRoster } from "@/actions/rosters";
import { getEmployees } from "@/actions/employees";
import { getPositions } from "@/actions/positions";
import { getShifts } from "@/actions/shifts";
import { RosterViewClient } from "./client";

export default async function RosterDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const [roster, employees, positions, rawShifts] = await Promise.all([
		getRoster(id).catch(() => null),
		getEmployees(),
		getPositions(),
		getShifts(),
	]);

	if (!roster) notFound();

	const mappedEmployees = employees.map((e) => ({
		id: e.id,
		firstName: e.first_name,
		lastName: e.last_name,
		maxHoursPerWeek: e.max_hours_per_week,
		positionIds: e.employee_positions.map((ep) => ep.position_id),
		primaryPositionId: e.employee_positions.find((ep: { is_primary: boolean }) => ep.is_primary)?.position_id,
		availability: e.employee_availability.map((a) => ({
			dayOfWeek: a.day_of_week,
			startTime: a.start_time,
			endTime: a.end_time,
		})),
	}));

	const mappedShifts = rawShifts.map((s) => ({
		id: s.id,
		positionId: s.position_id,
		name: s.name,
		schedules: s.shift_schedules.map((ss) => ({
			dayOfWeek: ss.day_of_week,
			startTime: ss.start_time,
			endTime: ss.end_time,
			count: ss.count,
		})),
	}));

	const mappedPositions = positions.map((p) => ({
		id: p.id,
		name: p.name,
		color: p.color,
	}));

	const assignments = roster.roster_assignments.map((a) => ({
		employeeId: a.employee_id,
		shiftId: a.shift_id,
		date: a.date,
	}));

	return (
		<RosterViewClient
			roster={roster}
			assignments={assignments}
			employees={mappedEmployees}
			shifts={mappedShifts}
			positions={mappedPositions}
		/>
	);
}
