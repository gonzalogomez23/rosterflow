import { z } from "zod";

export const rosterSchema = z.object({
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type RosterFormData = z.infer<typeof rosterSchema>;
