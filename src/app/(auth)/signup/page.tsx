"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(formData: FormData) {
		setPending(true);
		setError(null);
		const result = await signup(formData);
		if (result?.error) {
			setError(result.error);
			setPending(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="items-center">
					<Image src="/logo/box-primary.svg" alt="RosterFlow" width={180} height={106} priority />
					<CardDescription className="font-story-script text-base">
						Set up your organization in RosterFlow
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleSubmit} className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="full_name">Your Name</Label>
							<Input
								id="full_name"
								name="full_name"
								required
								placeholder="Jane Doe"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="organization_name">Organization Name</Label>
							<Input
								id="organization_name"
								name="organization_name"
								required
								placeholder="My Café"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
								placeholder="you@example.com"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								required
								minLength={6}
							/>
						</div>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
						<Button type="submit" disabled={pending} className="w-full">
							{pending ? "Creating account..." : "Sign up"}
						</Button>
					</form>
					<p className="mt-4 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link href="/login" className="underline hover:text-primary">
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
