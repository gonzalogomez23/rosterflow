import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { getEmployee } from "@/actions/employees";
import { getPositions } from "@/actions/positions";
import { EmployeeForm } from "@/components/employee-form";

export default async function EditEmployeePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const [employee, positions] = await Promise.all([
		getEmployee(id).catch(() => null),
		getPositions(),
	]);

	if (!employee) notFound();

	return (
		<div className="space-y-6">
			<PageHeader title="Edit Employee" description={`${employee.first_name} ${employee.last_name}`} />
			<EmployeeForm
				positions={positions}
				employee={employee}
			/>
		</div>
	);
}
