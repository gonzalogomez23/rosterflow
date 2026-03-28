import { PageHeader } from "@/components/page-header";
import { getPositions } from "@/actions/positions";
import { EmployeeForm } from "@/components/employee-form";

export default async function NewEmployeePage() {
	const positions = await getPositions();

	return (
		<div className="space-y-6">
			<PageHeader title="New Employee" description="Add a team member" />
			<EmployeeForm positions={positions} />
		</div>
	);
}
