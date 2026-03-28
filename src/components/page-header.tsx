interface PageHeaderProps {
	title: string;
	description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
	return (
		<div>
			<h1 className="text-3xl">{title}</h1>
			{description && (
				<p className="text-muted-foreground">{description}</p>
			)}
		</div>
	);
}
