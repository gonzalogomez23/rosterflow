export interface Position {
	id: string;
	name: string;
	color: string;
}

export interface ShiftSchedule {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	count: number;
}

export interface Shift {
	id: string;
	positionId: string;
	name: string;
	schedules: ShiftSchedule[];
}

export interface Employee {
	id: string;
	firstName: string;
	lastName: string;
	maxHoursPerWeek: number;
	positionIds: string[];
	availability: EmployeeAvailability[];
}

export interface EmployeeAvailability {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

export interface RosterAssignment {
	employeeId: string;
	shiftId: string;
	date: string; // "YYYY-MM-DD"
}

export interface Slot {
	date: string;
	dayOfWeek: number;
	shiftId: string;
	startTime: string;
	endTime: string;
}

export interface RosterResult {
	assignments: RosterAssignment[];
	warnings: string[];
	stats: {
		totalSlots: number;
		filledSlots: number;
		employeeHours: Record<string, number>;
	};
}

export interface GenerateInput {
	startDate: string;
	endDate: string;
	employees: Employee[];
	shifts: Shift[];
	positions: Position[];
	previousAssignments?: RosterAssignment[];
}
