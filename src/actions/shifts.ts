"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getShifts() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("shifts")
		.select("*, shift_schedules(*)")
		.order("name");

	if (error) throw error;
	return data;
}

export async function getShiftsByPosition(positionId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("shifts")
		.select("*, shift_schedules(*)")
		.eq("position_id", positionId)
		.order("name");

	if (error) throw error;
	return data;
}

export async function createShift(positionId: string, name: string) {
	const supabase = await createClient();
	const orgId = await getOrgId(supabase);

	const { data, error } = await supabase
		.from("shifts")
		.insert({
			organization_id: orgId,
			position_id: positionId,
			name,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
	return { id: data.id };
}

export async function updateShift(id: string, name: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("shifts")
		.update({ name })
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
}

export async function deleteShift(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("shifts").delete().eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
}

export async function upsertShiftSchedule(
	shiftId: string,
	dayOfWeek: number,
	startTime: string,
	endTime: string,
	count: number,
) {
	const supabase = await createClient();

	if (count === 0) {
		await supabase
			.from("shift_schedules")
			.delete()
			.eq("shift_id", shiftId)
			.eq("day_of_week", dayOfWeek);
	} else {
		const { data: existing } = await supabase
			.from("shift_schedules")
			.select("id")
			.eq("shift_id", shiftId)
			.eq("day_of_week", dayOfWeek)
			.maybeSingle();

		if (existing) {
			await supabase
				.from("shift_schedules")
				.update({ start_time: startTime, end_time: endTime, count })
				.eq("id", existing.id);
		} else {
			await supabase.from("shift_schedules").insert({
				shift_id: shiftId,
				day_of_week: dayOfWeek,
				start_time: startTime,
				end_time: endTime,
				count,
			});
		}
	}

	revalidatePath("/dashboard/positions");
}

export async function deleteShiftSchedule(shiftId: string, dayOfWeek: number) {
	const supabase = await createClient();
	await supabase
		.from("shift_schedules")
		.delete()
		.eq("shift_id", shiftId)
		.eq("day_of_week", dayOfWeek);

	revalidatePath("/dashboard/positions");
}

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
	const { data } = await supabase.rpc("get_user_org_id");
	return data as string;
}
