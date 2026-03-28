import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
	subsets: ["latin"],
	variable: "--font-outfit",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "RosterFlow",
	description: "Roster generation for rotating shifts",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/light/favicon-32x32.png" media="(prefers-color-scheme: light)" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon/light/favicon-16x16.png" media="(prefers-color-scheme: light)" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon/dark/favicon-32x32.png" media="(prefers-color-scheme: dark)" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon/dark/favicon-16x16.png" media="(prefers-color-scheme: dark)" />
				<link rel="apple-touch-icon" sizes="180x180" href="/favicon/light/apple-touch-icon.png" media="(prefers-color-scheme: light)" />
				<link rel="apple-touch-icon" sizes="180x180" href="/favicon/dark/apple-touch-icon.png" media="(prefers-color-scheme: dark)" />
			</head>
			<body className={`${outfit.variable} ${inter.variable} font-inter`}>{children}</body>
		</html>
	);
}
