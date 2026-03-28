"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
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

export default function LoginPage() {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(formData: FormData) {
		setPending(true);
		setError(null);
		const result = await login(formData);
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
					<CardDescription className="font-story-script text-base">Sign in to manage your rosters</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleSubmit} className="grid gap-4">
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
							{pending ? "Signing in..." : "Sign in"}
						</Button>
					</form>
					<p className="mt-4 text-center text-sm text-muted-foreground">
						Don&apos;t have an account?{" "}
						<Link href="/signup" className="underline hover:text-primary">
							Sign up
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
