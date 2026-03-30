"use client";

import { useEffect, useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, CalendarClock, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPositions, updatePosition } from "@/actions/positions";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	getShiftsByPosition,
	createShift,
	updateShift,
	deleteShift,
	upsertShiftSchedule,
	deleteShiftSchedule,
} from "@/actions/shifts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Position {
	id: string;
	name: string;
	color: string;
}

interface ShiftSchedule {
	id: string;
	shift_id: string;
	day_of_week: number;
	start_time: string;
	end_time: string;
	count: number;
}

interface Shift {
	id: string;
	name: string;
	position_id: string;
	shift_schedules: ShiftSchedule[];
}

type DaySchedule = { start_time: string; end_time: string; count: number } | null;
type ShiftDraft = Record<number, DaySchedule>;
type ShiftTemplate = { start_time: string; end_time: string; count: number };

function buildDraft(schedules: ShiftSchedule[]): ShiftDraft {
	const draft: ShiftDraft = {};
	for (const s of schedules) {
		draft[s.day_of_week] = { start_time: s.start_time, end_time: s.end_time, count: s.count };
	}
	return draft;
}

function fmtTime(t: string) {
	return t.slice(0, 5);
}

export default function PositionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: positionId } = use(params);
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [position, setPosition] = useState<Position | null>(null);
	const [shifts, setShifts] = useState<Shift[]>([]);
	const [isCreatingShift, setIsCreatingShift] = useState(false);
	const [newShiftName, setNewShiftName] = useState("");
	const [newShiftTemplate, setNewShiftTemplate] = useState<ShiftTemplate>({ start_time: "09:00", end_time: "17:00", count: 1 });
	const [newShiftDraft, setNewShiftDraft] = useState<ShiftDraft>({});
	const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
	const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
	const [pendingCloseSchedule, setPendingCloseSchedule] = useState<string | null>(null);
	const [editingShiftName, setEditingShiftName] = useState("");
	const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
	const [editingPosition, setEditingPosition] = useState(false);
	const [editPosName, setEditPosName] = useState("");
	const [editPosColor, setEditPosColor] = useState("");

	const [draftSchedules, setDraftSchedules] = useState<Record<string, ShiftDraft>>({});
	const [templateByShift, setTemplateByShift] = useState<Record<string, ShiftTemplate>>({});
	const [dirtyShifts, setDirtyShifts] = useState<Set<string>>(new Set());

	useEffect(() => {
		loadData();
	}, [positionId]);

	async function loadData() {
		const [positions, shiftsData] = await Promise.all([
			getPositions(),
			getShiftsByPosition(positionId),
		]);
		const pos = positions.find((p) => p.id === positionId);
		if (!pos) {
			router.push("/dashboard/positions");
			return;
		}
		setPosition(pos);
		setShifts(shiftsData);

		const drafts: Record<string, ShiftDraft> = {};
		const templates: Record<string, ShiftTemplate> = {};
		for (const shift of shiftsData) {
			drafts[shift.id] = buildDraft(shift.shift_schedules);
			templates[shift.id] = templateByShift[shift.id] ?? { start_time: "09:00", end_time: "17:00", count: 1 };
		}
		setDraftSchedules(drafts);
		setTemplateByShift(templates);
		setDirtyShifts(new Set());
	}

	function handleCreateShift() {
		if (!newShiftName.trim()) return;
		startTransition(async () => {
			const result = await createShift(positionId, newShiftName.trim());
			if ("id" in result) {
				const shiftId = result.id as string;
				for (let day = 0; day < 7; day++) {
					const entry = newShiftDraft[day];
					if (entry && entry.count > 0) {
						await upsertShiftSchedule(shiftId, day, entry.start_time, entry.end_time, entry.count);
					}
				}
			}
			setNewShiftName("");
			setNewShiftDraft({});
			setNewShiftTemplate({ start_time: "09:00", end_time: "17:00", count: 1 });
			setIsCreatingShift(false);
			await loadData();
		});
	}

	function handleUpdateShift(id: string) {
		if (!editingShiftName.trim()) return;
		startTransition(async () => {
			await updateShift(id, editingShiftName.trim());
			setEditingShiftId(null);
			await loadData();
		});
	}

	function handleUpdatePosition() {
		if (!editPosName.trim()) return;
		const fd = new FormData();
		fd.set("name", editPosName.trim());
		fd.set("color", editPosColor);
		startTransition(async () => {
			await updatePosition(positionId, fd);
			setEditingPosition(false);
			await loadData();
		});
	}

	function handleDeleteShift(id: string) {
		startTransition(async () => {
			await deleteShift(id);
			if (editingScheduleId === id) setEditingScheduleId(null);
			await loadData();
		});
	}

	function updateTemplate(shiftId: string, field: keyof ShiftTemplate, value: string | number) {
		const newTemplate = { ...(templateByShift[shiftId] ?? { start_time: "09:00", end_time: "17:00", count: 1 }), [field]: value };
		setTemplateByShift((prev) => ({ ...prev, [shiftId]: newTemplate }));
		// Update all active days in the draft with the new template values
		setDraftSchedules((prev) => {
			const draft = { ...(prev[shiftId] ?? {}) };
			for (const day in draft) {
				if (draft[day] !== null && draft[day] !== undefined) {
					draft[day] = { ...newTemplate };
				}
			}
			return { ...prev, [shiftId]: draft };
		});
		setDirtyShifts((prev) => new Set(prev).add(shiftId));
	}

	function handleToggleDay(shiftId: string, dayIdx: number) {
		const draft = draftSchedules[shiftId] ?? {};
		const template = templateByShift[shiftId] ?? { start_time: "09:00", end_time: "17:00", count: 1 };
		const newDraft = { ...draft };
		newDraft[dayIdx] = newDraft[dayIdx] ? null : { ...template };
		setDraftSchedules((prev) => ({ ...prev, [shiftId]: newDraft }));
		setDirtyShifts((prev) => new Set(prev).add(shiftId));
	}

	function handleSaveShift(shiftId: string) {
		startTransition(async () => {
			const draft = draftSchedules[shiftId] ?? {};
			const shift = shifts.find((s) => s.id === shiftId);
			const savedDays = new Set(shift?.shift_schedules.map((s) => s.day_of_week) ?? []);

			for (let day = 0; day < 7; day++) {
				const entry = draft[day];
				if (entry && entry.count > 0) {
					await upsertShiftSchedule(shiftId, day, entry.start_time, entry.end_time, entry.count);
				} else if (savedDays.has(day)) {
					await deleteShiftSchedule(shiftId, day);
				}
			}

			setEditingScheduleId(null);
			await loadData();
		});
	}

	if (!position) {
		return <div className="text-muted-foreground">Loading...</div>;
	}

	return (
		<>
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard/positions">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				{editingPosition ? (
					<div className="flex items-center gap-2">
						<ColorPicker name="color" defaultValue={editPosColor} onChange={setEditPosColor} />
						<Input
							autoFocus
							value={editPosName}
							onChange={(e) => setEditPosName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleUpdatePosition();
								if (e.key === "Escape") setEditingPosition(false);
							}}
							className="w-64 text-lg"
						/>
						<Button size="sm" onClick={handleUpdatePosition} disabled={pending}>
							Save
						</Button>
						<Button size="sm" variant="ghost" onClick={() => setEditingPosition(false)}>
							Cancel
						</Button>
					</div>
				) : (
					<button
						type="button"
						className="group flex items-center gap-2 cursor-pointer"
						onClick={() => { setEditingPosition(true); setEditPosName(position.name); setEditPosColor(position.color); }}
					>
						<div className="h-4 w-4 rounded" style={{ backgroundColor: position.color }} />
						<h1 className="text-4xl">{position.name}</h1>
						<Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
					</button>
				)}
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between gap-16">
					<CardTitle>Shifts</CardTitle>
					{!isCreatingShift && (
						<Button variant="outline" onClick={() => setIsCreatingShift(true)}>
							<Plus className="h-4 w-4" />
							Add Shift
						</Button>
					)}
				</div>

				{isCreatingShift && (
					<Card className="border-primary">
							<CardHeader className="py-3">
								<Input
									autoFocus
									placeholder="Shift name (e.g. Morning)"
									value={newShiftName}
									onChange={(e) => setNewShiftName(e.target.value)}
									onKeyDown={(e) => e.key === "Escape" && (setIsCreatingShift(false), setNewShiftName(""))}
								/>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase">Schedule</p>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground w-10">From</span>
											<Input
												type="time"
												value={newShiftTemplate.start_time}
												onChange={(e) => setNewShiftTemplate((t) => ({ ...t, start_time: e.target.value }))}
												className="w-32"
											/>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground w-10">To</span>
											<Input
												type="time"
												value={newShiftTemplate.end_time}
												onChange={(e) => setNewShiftTemplate((t) => ({ ...t, end_time: e.target.value }))}
												className="w-32"
											/>
										</div>
									</div>
								</div>
								<hr className="border-border" />
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase">Days</p>
									<div className="flex gap-1.5">
										{DAYS.map((day, dayIdx) => {
											const isActive = newShiftDraft[dayIdx] !== null && newShiftDraft[dayIdx] !== undefined;
											return (
												<button
													key={dayIdx}
													type="button"
													onClick={() =>
														setNewShiftDraft((d) => ({
															...d,
															[dayIdx]: isActive ? null : { ...newShiftTemplate },
														}))
													}
													className={`w-10 rounded py-1.5 text-xs font-semibold transition-colors ${
														isActive
															? "bg-primary text-primary-foreground"
															: "bg-muted text-muted-foreground hover:bg-muted/70"
													}`}
												>
													{day}
												</button>
											);
										})}
									</div>
								</div>
								<hr className="border-border" />
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase">Staff</p>
									<Input
										type="number"
										min={1}
										max={50}
										value={newShiftTemplate.count}
										onChange={(e) => setNewShiftTemplate((t) => ({ ...t, count: Number.parseInt(e.target.value) || 1 }))}
										className="w-16 text-center"
									/>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="ghost"
										onClick={() => { setIsCreatingShift(false); setNewShiftName(""); setNewShiftDraft({}); setNewShiftTemplate({ start_time: "09:00", end_time: "17:00", count: 1 }); }}
									>
										Cancel
									</Button>
									<Button onClick={handleCreateShift} disabled={pending || !newShiftName.trim()}>
										Create shift
									</Button>
								</div>
							</CardContent>
						</Card>
				)}

					{shifts.length === 0 && (
						<p className="text-sm text-muted-foreground">No shifts yet. Add one above.</p>
					)}

					{shifts.map((shift) => {
						const draft = draftSchedules[shift.id] ?? {};
						const template = templateByShift[shift.id] ?? { start_time: "09:00", end_time: "17:00", count: 1 };
						const isDirty = dirtyShifts.has(shift.id);
						const isEditingSchedule = editingScheduleId === shift.id;
						const activeDays = Object.entries(draft)
							.filter(([, v]) => v !== null && v !== undefined)
							.map(([k]) => Number(k));

						// Single schedule: use first active day's values for display
						const firstEntry = activeDays.length > 0 ? draft[activeDays[0]]! : null;

						return (
							<Card key={shift.id} className={isEditingSchedule ? "border-primary" : ""}>
								<CardHeader className="py-4">
									<div className="flex items-center justify-between">
										{editingShiftId === shift.id ? (
											<div className="flex gap-2">
												<Input
													value={editingShiftName}
													onChange={(e) => setEditingShiftName(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && handleUpdateShift(shift.id)}
													className="w-48"
												/>
												<Button size="sm" onClick={() => handleUpdateShift(shift.id)} disabled={pending}>
													Save
												</Button>
												<Button size="sm" variant="ghost" onClick={() => setEditingShiftId(null)}>
													Cancel
												</Button>
											</div>
										) : (
											<button
												type="button"
												className="group flex items-center gap-1.5 cursor-pointer"
												onClick={() => { setEditingShiftId(shift.id); setEditingShiftName(shift.name); }}
											>
												<CardTitle className="text-base">{shift.name}</CardTitle>
												<Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
											</button>
										)}
										<div className="flex gap-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													if (isEditingSchedule) {
														if (isDirty) {
															setPendingCloseSchedule(shift.id);
														} else {
															setEditingScheduleId(null);
														}
													} else {
														setEditingScheduleId(shift.id);
													}
												}}
											>
												{isEditingSchedule ? (
													<X className="h-3.5 w-3.5" />
												) : (
													<><CalendarClock className="h-3.5 w-3.5" />Edit</>
												)}
											</Button>
											<Button
												size="icon-sm"
												variant="ghost"
												className="hover:bg-red-100 dark:hover:bg-red-950/30 [&:hover_svg]:text-red-500"
												onClick={() => setShiftToDelete(shift.id)}
												disabled={pending}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>

								<CardContent className="space-y-3 p-4 pt-0">
									{isEditingSchedule ? (
										/* Editor */
										<div className="space-y-5">
											<div className="space-y-2">
												<p className="text-xs font-semibold uppercase">Schedule</p>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<span className="text-sm text-muted-foreground w-10">From</span>
														<Input
															type="time"
															value={template.start_time}
															onChange={(e) => updateTemplate(shift.id, "start_time", e.target.value)}
															className="w-32"
														/>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-sm text-muted-foreground w-10">To</span>
														<Input
															type="time"
															value={template.end_time}
															onChange={(e) => updateTemplate(shift.id, "end_time", e.target.value)}
															className="w-32"
														/>
													</div>
												</div>
											</div>
											<hr className="border-border" />
											<div className="space-y-2">
												<p className="text-xs font-semibold uppercase">Days</p>
												<div className="flex gap-1.5">
													{DAYS.map((day, dayIdx) => {
														const isActive = activeDays.includes(dayIdx);
														return (
															<button
																key={dayIdx}
																type="button"
																onClick={() => handleToggleDay(shift.id, dayIdx)}
																className={`w-10 rounded py-1.5 text-xs font-semibold transition-colors ${
																	isActive
																		? "bg-primary text-primary-foreground"
																		: "bg-muted text-muted-foreground hover:bg-muted/70"
																}`}
															>
																{day}
															</button>
														);
													})}
												</div>
											</div>
											<hr className="border-border" />
											<div className="space-y-2">
												<p className="text-xs font-semibold uppercase">Staff</p>
												<Input
													type="number"
													min={1}
													max={50}
													value={template.count}
													onChange={(e) => updateTemplate(shift.id, "count", Number.parseInt(e.target.value) || 1)}
													className="w-16 text-center"
												/>
											</div>
											<div className="flex justify-end">
												<Button
													onClick={() => handleSaveShift(shift.id)}
													disabled={pending || !isDirty}
												>
													Save schedule
												</Button>
											</div>
										</div>
								) : (
									/* Summary */
									firstEntry ? (
										<div className="flex items-center py-3 px-4 bg-primary/4">
											<div className="shrink-0 pr-4">
												<div className="flex items-baseline gap-1.5">
													<span className="text-xs text-muted-foreground w-7">From</span>
													<span className="text-sm font-medium">{fmtTime(firstEntry.start_time)}</span>
												</div>
												<div className="flex items-baseline gap-1.5">
													<span className="text-xs text-muted-foreground w-7">To</span>
													<span className="text-sm font-medium">{fmtTime(firstEntry.end_time)}</span>
												</div>
											</div>
											<div className="w-px self-stretch bg-border mx-4" />
											<div className="flex flex-wrap gap-1.5 py-0.5">
												{activeDays.map((dayIdx) => (
													<span
														key={dayIdx}
														className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
													>
														{DAYS[dayIdx]}
													</span>
												))}
											</div>
											<div className="w-px self-stretch bg-border mx-4" />
											<div className="shrink-0">
												<span className="text-sm font-medium whitespace-nowrap">{firstEntry.count} staff</span>
											</div>
										</div>
									) : (
										<p className="text-sm text-muted-foreground">No schedule set.</p>
									)
									)}
								</CardContent>
							</Card>
						);
					})}
			</div>
		</div>

		<Dialog open={shiftToDelete !== null} onOpenChange={(open: boolean) => { if (!open) setShiftToDelete(null); }}>
			<DialogContent onClose={() => setShiftToDelete(null)}>
				<DialogHeader>
					<DialogTitle>Delete shift</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Are you sure you want to delete this shift? This action cannot be undone.
				</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={() => setShiftToDelete(null)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={pending}
						onClick={() => {
							if (shiftToDelete) {
								handleDeleteShift(shiftToDelete);
								setShiftToDelete(null);
							}
						}}
					>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>

	<Dialog open={pendingCloseSchedule !== null} onOpenChange={(open: boolean) => { if (!open) setPendingCloseSchedule(null); }}>
		<DialogContent onClose={() => setPendingCloseSchedule(null)}>
			<DialogHeader>
				<DialogTitle>Unsaved changes</DialogTitle>
			</DialogHeader>
			<p className="text-sm text-muted-foreground">
				You have unsaved changes in this schedule. Do you want to save them before closing?
			</p>
			<div className="flex justify-end gap-2 pt-2">
				<Button
					variant="ghost"
					onClick={() => {
						setEditingScheduleId(null);
						setPendingCloseSchedule(null);
					}}
				>
					Discard
				</Button>
				<Button
					disabled={pending}
					onClick={() => {
						if (pendingCloseSchedule) {
							handleSaveShift(pendingCloseSchedule);
						}
						setPendingCloseSchedule(null);
					}}
				>
					Save
				</Button>
			</div>
		</DialogContent>
	</Dialog>
	</>
	);
}
