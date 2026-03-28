import { z } from "zod";

export const shiftSchema = z.object({
	name: z.string().min(1, "Name is required"),
	position_id: z.string().uuid(),
});

export type ShiftFormData = z.infer<typeof shiftSchema>;

export const shiftScheduleSchema = z.object({
	shift_id: z.string().uuid(),
	day_of_week: z.number().min(0).max(6),
	start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
	end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
	count: z.coerce.number().min(0).max(50),
});

export type ShiftScheduleFormData = z.infer<typeof shiftScheduleSchema>;
