"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div
				className="fixed inset-0 bg-black/80"
				onClick={() => onOpenChange(false)}
				onKeyDown={(e) => {
					if (e.key === "Escape") onOpenChange(false);
				}}
			/>
			{children}
		</div>
	);
}

const DialogContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 sm:rounded-lg",
			className,
		)}
		{...props}
	>
		{children}
		{onClose && (
			<button
				type="button"
				className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				onClick={onClose}
			>
				<X className="h-4 w-4" />
			</button>
		)}
	</div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-1.5 text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);

const DialogTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h2
		ref={ref}
		className={cn(
			"text-lg font-semibold leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
));
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogContent, DialogHeader, DialogTitle };
