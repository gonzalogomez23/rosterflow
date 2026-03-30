import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getRosters } from "@/actions/rosters";

const statusVariant: Record<string, "secondary" | "success" | "outline"> = {
	draft: "secondary",
	published: "success",
	archived: "outline",
};

export default async function RostersPage() {
	const rosters = await getRosters();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader title="Rosters" description="Generated schedules" />
				<Button asChild>
					<Link href="/dashboard/rosters/generate">
						<Plus className="h-4 w-4" />
						Generate Roster
					</Link>
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Period</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="w-20">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rosters.map((roster) => (
						<TableRow key={roster.id}>
							<TableCell className="font-medium">
								{roster.start_date.split("-").reverse().join("/")} — {roster.end_date.split("-").reverse().join("/")}
							</TableCell>
							<TableCell>
								<Badge variant={statusVariant[roster.status]}>
									{roster.status}
								</Badge>
							</TableCell>
							<TableCell>
								{new Date(roster.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
							</TableCell>
							<TableCell>
								<Button asChild size="sm" variant="outline">
									<Link href={`/dashboard/rosters/${roster.id}`}>
										View
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
					{rosters.length === 0 && (
						<TableRow>
							<TableCell colSpan={4} className="text-center text-muted-foreground">
								No rosters yet.{" "}
								<Link href="/dashboard/rosters/generate" className="underline">
									Generate one
								</Link>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
