"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
	const [showDeleteModal, setShowDeleteModal] = useState(false);

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
		<>
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-baseline gap-3">
					<h1 className="text-4xl">Roster</h1>
					<span className="text-base text-muted-foreground">
						{roster.start_date.split("-").reverse().slice(0, 2).join("/")} - {roster.end_date.split("-").reverse().slice(0, 2).join("/")}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant={statusVariant[roster.status]}>
						{roster.status}
					</Badge>
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
							<Archive className="h-4 w-4" />
							Archive
						</Button>
					)}
					<Button
						size="icon"
						variant="outline"
						className="hover:bg-red-100 hover:border-red-200 dark:hover:bg-red-950/30 [&:hover_svg]:text-red-500"
						onClick={() => setShowDeleteModal(true)}
						disabled={pending}
					>
						<Trash2 className="h-4 w-4" />
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

			<p className="text-sm text-muted-foreground text-right">
				Created {new Date(roster.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
			</p>
		</div>

		<Dialog open={showDeleteModal} onOpenChange={(open: boolean) => { if (!open) setShowDeleteModal(false); }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete roster</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Are you sure you want to delete this roster? This action cannot be undone.
				</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={pending}
						onClick={() => {
							setShowDeleteModal(false);
							handleDelete();
						}}
					>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
		</>
	);
}
