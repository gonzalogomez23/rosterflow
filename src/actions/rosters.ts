"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RosterAssignment } from "@/lib/roster-engine/types";

export async function getRosters() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("rosters")
		.select("*")
		.order("start_date", { ascending: false });

	if (error) throw error;
	return data;
}

export async function getRoster(id: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("rosters")
		.select("*, roster_assignments(*)")
		.eq("id", id)
		.single();

	if (error) throw error;
	return data;
}

export async function saveRoster(
	startDate: string,
	endDate: string,
	assignments: RosterAssignment[],
) {
	const supabase = await createClient();
	const orgId = await getOrgId(supabase);

	const { data: roster, error } = await supabase
		.from("rosters")
		.insert({
			organization_id: orgId,
			start_date: startDate,
			end_date: endDate,
			status: "draft",
		})
		.select()
		.single();

	if (error) return { error: error.message };

	if (assignments.length > 0) {
		const { error: assignError } = await supabase
			.from("roster_assignments")
			.insert(
				assignments.map((a) => ({
					roster_id: roster.id,
					employee_id: a.employeeId,
					shift_id: a.shiftId,
					date: a.date,
				})),
			);

		if (assignError) return { error: assignError.message };
	}

	revalidatePath("/dashboard/rosters");
	return { id: roster.id };
}

export async function updateRosterStatus(
	id: string,
	status: string,
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("rosters")
		.update({ status, updated_at: new Date().toISOString() })
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/rosters");
}

export async function updateRosterAssignment(
	rosterId: string,
	assignmentId: string | null,
	data: {
		employeeId: string;
		shiftId: string;
		date: string;
	} | null,
) {
	const supabase = await createClient();

	if (assignmentId && !data) {
		// Remove assignment
		await supabase.from("roster_assignments").delete().eq("id", assignmentId);
	} else if (assignmentId && data) {
		// Update assignment
		await supabase
			.from("roster_assignments")
			.update({
				employee_id: data.employeeId,
				shift_id: data.shiftId,
				date: data.date,
			})
			.eq("id", assignmentId);
	} else if (data) {
		// Create new assignment
		await supabase.from("roster_assignments").insert({
			roster_id: rosterId,
			employee_id: data.employeeId,
			shift_id: data.shiftId,
			date: data.date,
		});
	}

	revalidatePath(`/dashboard/rosters/${rosterId}`);
}

export async function deleteRoster(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("rosters").delete().eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/rosters");
}

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
	const { data } = await supabase.rpc("get_user_org_id");
	return data as string;
}
