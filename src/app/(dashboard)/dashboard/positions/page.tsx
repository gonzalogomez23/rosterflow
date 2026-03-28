"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Settings, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	getPositions,
	createPosition,
	updatePosition,
	deletePosition,
} from "@/actions/positions";
import { getShifts } from "@/actions/shifts";

interface Position {
	id: string;
	name: string;
	color: string;
}

export default function PositionsPage() {
	const [positions, setPositions] = useState<Position[]>([]);
	const [shiftCounts, setShiftCounts] = useState<Record<string, number>>({});
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		loadPositions();
	}, []);

	async function loadPositions() {
		const [data, shifts] = await Promise.all([getPositions(), getShifts()]);
		setPositions(data);
		const counts: Record<string, number> = {};
		for (const s of shifts) {
			counts[s.position_id] = (counts[s.position_id] ?? 0) + 1;
		}
		setShiftCounts(counts);
	}

	function handleCreate(formData: FormData) {
		startTransition(async () => {
			await createPosition(formData);
			setShowCreate(false);
			await loadPositions();
		});
	}

	function handleUpdate(id: string, formData: FormData) {
		startTransition(async () => {
			await updatePosition(id, formData);
			setEditingId(null);
			await loadPositions();
		});
	}

	function handleDelete() {
		if (!deletingId) return;
		startTransition(async () => {
			await deletePosition(deletingId);
			setDeletingId(null);
			await loadPositions();
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<PageHeader title="Positions" description="Manage the roles employees can fill" />
				{!showCreate && (
					<Button onClick={() => setShowCreate(true)}>
						<Plus className="h-4 w-4 mr-1.5" />
						New Position
					</Button>
				)}
			</div>

			{showCreate && (
				<form action={handleCreate} className="flex items-center gap-2">
					<ColorPicker name="color" />
					<Input name="name" placeholder="Position name" required autoFocus />
					<Button type="submit" disabled={pending}>
						Add
					</Button>
					<Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
						Cancel
					</Button>
				</form>
			)}

			{/* List */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Position</TableHead>
						<TableHead className="w-48 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{positions.map((pos) => (
						<TableRow key={pos.id}>
							{editingId === pos.id ? (
								<>
									<TableCell>
										<form
											id={`edit-${pos.id}`}
											action={(fd) => handleUpdate(pos.id, fd)}
											className="flex items-center gap-2"
										>
											<ColorPicker name="color" defaultValue={pos.color} />
											<Input
												name="name"
												defaultValue={pos.name}
												required
											/>
										</form>
									</TableCell>
									<TableCell>
										<div className="flex gap-1 justify-end">
											<Button
												size="sm"
												type="submit"
												form={`edit-${pos.id}`}
												disabled={pending}
											>
												Save
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setEditingId(null)}
											>
												Cancel
											</Button>
										</div>
									</TableCell>
								</>
							) : (
								<>
									<TableCell>
										<div className="flex items-center gap-2.5">
											<div
												className="h-3.5 w-3.5 rounded-full shrink-0"
												style={{ backgroundColor: pos.color }}
											/>
											<span className="font-semibold">{pos.name}</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2 justify-end">
											<Badge variant="secondary" className="whitespace-nowrap">
												{shiftCounts[pos.id] ?? 0} {(shiftCounts[pos.id] ?? 0) === 1 ? "shift" : "shifts"}
											</Badge>
											<Button
												size="sm"
												variant="outline"
												asChild
											>
												<Link href={`/dashboard/positions/${pos.id}`}>
													<Settings className="h-3.5 w-3.5 mr-1.5" />
													Manage
												</Link>
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="cursor-pointer"
												onClick={() => setEditingId(pos.id)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="cursor-pointer"
												onClick={() => setDeletingId(pos.id)}
												disabled={pending}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</>
							)}
						</TableRow>
					))}
					{positions.length === 0 && (
						<TableRow>
							<TableCell colSpan={2} className="text-center text-muted-foreground">
								No positions yet. Add one above.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
				<DialogContent onClose={() => setDeletingId(null)}>
					<DialogHeader>
						<DialogTitle>Delete position</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						Are you sure you want to delete{" "}
						<span className="font-medium text-foreground">
							{positions.find((p) => p.id === deletingId)?.name}
						</span>
						? This will also delete all its shifts and schedules. This action cannot be undone.
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="ghost" onClick={() => setDeletingId(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={pending}>
							{pending ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
