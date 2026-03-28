"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEmployee, updateEmployee } from "@/actions/employees";
import type { EmployeeFormData } from "@/lib/validations/employee";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Position {
	id: string;
	name: string;
	color: string;
}

interface AvailabilityWindow {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

interface Props {
	positions: Position[];
	employee?: {
		id: string;
		first_name: string;
		last_name: string;
		email: string | null;
		phone: string | null;
		max_hours_per_week: number;
		employee_positions: { position_id: string }[];
		employee_availability: {
			day_of_week: number;
			start_time: string;
			end_time: string;
		}[];
	};
}

export function EmployeeForm({ positions, employee }: Props) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
		new Set(employee?.employee_positions.map((ep) => ep.position_id) ?? []),
	);

	const [availability, setAvailability] = useState<AvailabilityWindow[]>(() => {
		if (!employee?.employee_availability) {
			// Default: Mon-Fri 09:00-17:00
			return Array.from({ length: 5 }, (_, i) => ({
				dayOfWeek: i,
				startTime: "09:00",
				endTime: "17:00",
			}));
		}
		return employee.employee_availability.map((a) => ({
			dayOfWeek: a.day_of_week,
			startTime: a.start_time,
			endTime: a.end_time,
		}));
	});

	function togglePosition(id: string) {
		setSelectedPositions((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function getWindowsForDay(day: number) {
		return availability
			.map((w, idx) => ({ ...w, idx }))
			.filter((w) => w.dayOfWeek === day);
	}

	function updateWindow(idx: number, field: "startTime" | "endTime", value: string) {
		setAvailability((prev) => {
			const next = [...prev];
			next[idx] = { ...next[idx], [field]: value };
			return next;
		});
	}

	function addWindow(day: number) {
		setAvailability((prev) => [
			...prev,
			{ dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
		]);
	}

	function removeWindow(idx: number) {
		setAvailability((prev) => prev.filter((_, i) => i !== idx));
	}

	function handleSubmit(formData: FormData) {
		setError(null);

		const data: EmployeeFormData = {
			first_name: formData.get("first_name") as string,
			last_name: formData.get("last_name") as string,
			email: (formData.get("email") as string) || "",
			phone: (formData.get("phone") as string) || "",
			max_hours_per_week: Number(formData.get("max_hours_per_week")),
			position_ids: Array.from(selectedPositions),
			availability: availability.map((w) => ({
				day_of_week: w.dayOfWeek,
				start_time: w.startTime,
				end_time: w.endTime,
			})),
		};

		if (data.position_ids.length === 0) {
			setError("Select at least one position");
			return;
		}

		startTransition(async () => {
			const result = employee
				? await updateEmployee(employee.id, data)
				: await createEmployee(data);
			if (result && "error" in result) {
				setError(result.error ?? "Unknown error");
			} else {
				router.push("/dashboard/employees");
				router.refresh();
			}
		});
	}

	return (
		<form action={handleSubmit} className="space-y-6">
			{/* Basic info */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="first_name">First Name</Label>
						<Input
							id="first_name"
							name="first_name"
							required
							defaultValue={employee?.first_name}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="last_name">Last Name</Label>
						<Input
							id="last_name"
							name="last_name"
							required
							defaultValue={employee?.last_name}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							defaultValue={employee?.email ?? ""}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="phone">Phone</Label>
						<Input
							id="phone"
							name="phone"
							defaultValue={employee?.phone ?? ""}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="max_hours_per_week">Max Hours/Week</Label>
						<Input
							id="max_hours_per_week"
							name="max_hours_per_week"
							type="number"
							min={1}
							max={168}
							defaultValue={employee?.max_hours_per_week ?? 40}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Positions */}
			<Card>
				<CardHeader>
					<CardTitle>Positions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{positions.map((pos) => (
							<button
								key={pos.id}
								type="button"
								onClick={() => togglePosition(pos.id)}
								className={`rounded-full border px-3 py-1 text-sm transition-colors ${
									selectedPositions.has(pos.id)
										? "border-transparent text-white"
										: "bg-background hover:bg-accent"
								}`}
								style={
									selectedPositions.has(pos.id)
										? { backgroundColor: pos.color }
										: { borderColor: pos.color }
								}
							>
								{pos.name}
							</button>
						))}
						{positions.length === 0 && (
							<p className="text-sm text-muted-foreground">
								Create positions first.
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Availability */}
			<Card>
				<CardHeader>
					<CardTitle>Weekly Availability</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Set time windows when this employee is available. Multiple windows per day are supported.
					</p>
					{DAYS.map((day, dayIdx) => {
						const windows = getWindowsForDay(dayIdx);
						return (
							<div key={dayIdx} className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium w-12">{day}</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => addWindow(dayIdx)}
									>
										<Plus className="h-3 w-3 mr-1" />
										Add
									</Button>
								</div>
								{windows.length === 0 && (
									<p className="text-xs text-muted-foreground ml-12">Not available</p>
								)}
								{windows.map((w) => (
									<div key={w.idx} className="flex items-center gap-2 ml-12">
										<Input
											type="time"
											value={w.startTime}
											onChange={(e) => updateWindow(w.idx, "startTime", e.target.value)}
											className="w-32"
										/>
										<span className="text-muted-foreground">to</span>
										<Input
											type="time"
											value={w.endTime}
											onChange={(e) => updateWindow(w.idx, "endTime", e.target.value)}
											className="w-32"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeWindow(w.idx)}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						);
					})}
				</CardContent>
			</Card>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="flex gap-2">
				<Button type="submit" disabled={pending}>
					{pending
						? "Saving..."
						: employee
							? "Update Employee"
							: "Create Employee"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
