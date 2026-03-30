"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeFormData } from "@/lib/validations/employee";

export async function getEmployees() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("employees")
		.select(
			"*, employee_positions(position_id, is_primary), employee_availability(*)",
		)
		.eq("is_active", true)
		.order("first_name");

	if (error) throw error;
	return data;
}

export async function getEmployee(id: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("employees")
		.select(
			"*, employee_positions(position_id, is_primary), employee_availability(*)",
		)
		.eq("id", id)
		.single();

	if (error) throw error;
	return data;
}

export async function createEmployee(input: EmployeeFormData) {
	const supabase = await createClient();
	const orgId = await getOrgId(supabase);

	const { data: employee, error } = await supabase
		.from("employees")
		.insert({
			organization_id: orgId,
			first_name: input.first_name,
			last_name: input.last_name,
			email: input.email || null,
			phone: input.phone || null,
			max_hours_per_week: input.max_hours_per_week,
		})
		.select()
		.single();

	if (error) return { error: error.message };

	// Insert positions
	const positionRows = [
		{ employee_id: employee.id, position_id: input.primary_position_id, is_primary: true },
		...input.secondary_position_ids.map((pid) => ({
			employee_id: employee.id,
			position_id: pid,
			is_primary: false,
		})),
	];
	await supabase.from("employee_positions").insert(positionRows);

	// Insert availability
	if (input.availability.length > 0) {
		await supabase.from("employee_availability").insert(
			input.availability.map((a) => ({
				employee_id: employee.id,
				day_of_week: a.day_of_week,
				start_time: a.start_time,
				end_time: a.end_time,
			})),
		);
	}

	revalidatePath("/dashboard/employees");
	return { id: employee.id };
}

export async function updateEmployee(id: string, input: EmployeeFormData) {
	const supabase = await createClient();

	const { error } = await supabase
		.from("employees")
		.update({
			first_name: input.first_name,
			last_name: input.last_name,
			email: input.email || null,
			phone: input.phone || null,
			max_hours_per_week: input.max_hours_per_week,
		})
		.eq("id", id);

	if (error) return { error: error.message };

	// Replace positions
	await supabase.from("employee_positions").delete().eq("employee_id", id);
	const positionRows = [
		{ employee_id: id, position_id: input.primary_position_id, is_primary: true },
		...input.secondary_position_ids.map((pid) => ({
			employee_id: id,
			position_id: pid,
			is_primary: false,
		})),
	];
	await supabase.from("employee_positions").insert(positionRows);

	// Replace availability
	await supabase.from("employee_availability").delete().eq("employee_id", id);
	if (input.availability.length > 0) {
		await supabase.from("employee_availability").insert(
			input.availability.map((a) => ({
				employee_id: id,
				day_of_week: a.day_of_week,
				start_time: a.start_time,
				end_time: a.end_time,
			})),
		);
	}

	revalidatePath("/dashboard/employees");
}

export async function deleteEmployee(id: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("employees")
		.update({ is_active: false })
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/employees");
}

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
	const { data } = await supabase.rpc("get_user_org_id");
	return data as string;
}
