"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getPositions() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("positions")
		.select("*")
		.order("name");

	if (error) throw error;
	return data;
}

export async function createPosition(formData: FormData) {
	const supabase = await createClient();
	const orgId = await getOrgId(supabase);

	const { error } = await supabase.from("positions").insert({
		organization_id: orgId,
		name: formData.get("name") as string,
		color: (formData.get("color") as string) || "#6366f1",
	});

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
}

export async function updatePosition(id: string, formData: FormData) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("positions")
		.update({
			name: formData.get("name") as string,
			color: (formData.get("color") as string) || "#6366f1",
		})
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
}

export async function deletePosition(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("positions").delete().eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/dashboard/positions");
}

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
	const { data } = await supabase.rpc("get_user_org_id");
	return data as string;
}
