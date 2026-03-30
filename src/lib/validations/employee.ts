import { z } from "zod";

export const employeeSchema = z.object({
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional().or(z.literal("")),
	max_hours_per_week: z.coerce.number().min(1).max(168).default(40),
	primary_position_id: z.string().uuid("Select a primary position"),
	secondary_position_ids: z.array(z.string().uuid()),
	availability: z.array(
		z.object({
			day_of_week: z.number().min(0).max(6),
			start_time: z.string(),
			end_time: z.string(),
		}),
	),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
