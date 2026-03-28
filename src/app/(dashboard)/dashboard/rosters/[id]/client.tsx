"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RosterTable } from "@/components/roster-table";
import { updateRosterStatus, deleteRoster } from "@/actions/rosters";
import type {
	Employee,
	Position,
	RosterAssignment,
	Shift,
} from "@/lib/roster-engine/types";

const statusVariant: Record<string, "secondary" | "success" | "outline"> = {
	draft: "secondary",
	published: "success",
	archived: "outline",
};

interface Props {
	roster: {
		id: string;
		start_date: string;
		end_date: string;
		status: string;
		created_at: string;
	};
	assignments: RosterAssignment[];
	employees: Employee[];
	shifts: Shift[];
	positions: Position[];
}

export function RosterViewClient({
	roster,
	assignments,
	employees,
	shifts,
	positions,
}: Props) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function handleStatusChange(status: string) {
		startTransition(async () => {
			await updateRosterStatus(roster.id, status);
			router.refresh();
		});
	}

	function handleDelete() {
		startTransition(async () => {
			await deleteRoster(roster.id);
			router.push("/dashboard/rosters");
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl">
						Roster: {roster.start_date} — {roster.end_date}
					</h1>
					<div className="flex items-center gap-2 mt-1">
						<Badge variant={statusVariant[roster.status]}>
							{roster.status}
						</Badge>
						<span className="text-sm text-muted-foreground">
							Created {new Date(roster.created_at).toLocaleDateString()}
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					{roster.status === "draft" && (
						<Button
							onClick={() => handleStatusChange("published")}
							disabled={pending}
						>
							Publish
						</Button>
					)}
					{roster.status === "published" && (
						<Button
							variant="outline"
							onClick={() => handleStatusChange("archived")}
							disabled={pending}
						>
							Archive
						</Button>
					)}
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={pending}
					>
						Delete
					</Button>
				</div>
			</div>

			<RosterTable
				assignments={assignments}
				employees={employees}
				shifts={shifts}
				positions={positions}
				startDate={roster.start_date}
				endDate={roster.end_date}
			/>
		</div>
	);
}
