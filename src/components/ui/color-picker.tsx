"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
	"#3B82F6", // blue
	"#22C55E", // green
	"#EF4444", // red
	"#F97316", // orange
	"#EC4899", // pink
	"#8B5CF6", // purple
	"#14B8A6", // teal
	"#EAB308", // yellow
	"#6366F1", // indigo
	"#64748B", // slate
];

interface ColorPickerProps {
	name: string;
	defaultValue?: string;
}

export function ColorPicker({ name, defaultValue = "#6366F1" }: ColorPickerProps) {
	const normalizedDefault = defaultValue.toUpperCase();
	const isPreset = PRESET_COLORS.includes(normalizedDefault);
	const [selected, setSelected] = useState(defaultValue);
	const [customColor, setCustomColor] = useState(isPreset ? "#000000" : defaultValue);
	const [isCustom, setIsCustom] = useState(!isPreset);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const nativePickerRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [open]);

	return (
		<div ref={containerRef} className="relative">
			<input type="hidden" name={name} value={selected} />
			<button
				type="button"
				className="flex items-center gap-2 h-9 px-3 border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors"
				onClick={() => setOpen(!open)}
			>
				<span
					className="h-4 w-4 rounded-full shrink-0 border border-border"
					style={{ backgroundColor: selected }}
				/>
				<span className="text-muted-foreground">Color</span>
			</button>

			{open && (
				<div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border border border-border p-2">
					<div className="grid grid-cols-6 gap-1.5">
						{PRESET_COLORS.map((color) => (
							<button
								key={color}
								type="button"
								className={cn(
									"h-7 w-7 rounded-full cursor-pointer shrink-0 transition-all",
									selected.toUpperCase() === color && !isCustom
										? "ring-2 ring-offset-2 ring-foreground/50"
										: "hover:scale-110",
								)}
								style={{ backgroundColor: color }}
								onClick={() => {
									setSelected(color);
									setIsCustom(false);
									setOpen(false);
								}}
							/>
						))}
						<button
							type="button"
							className={cn(
								"h-7 w-7 rounded-full cursor-pointer shrink-0 transition-all overflow-hidden border border-border",
								isCustom
									? "ring-2 ring-offset-2 ring-foreground/50"
									: "hover:scale-110",
							)}
							style={{
								background: isCustom
									? customColor
									: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
							}}
							onClick={() => nativePickerRef.current?.click()}
						/>
					</div>
					<input
						ref={nativePickerRef}
						type="color"
						value={customColor}
						className="sr-only"
						onChange={(e) => {
							setCustomColor(e.target.value);
							setSelected(e.target.value);
							setIsCustom(true);
						}}
					/>
				</div>
			)}
		</div>
	);
}
