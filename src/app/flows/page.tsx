import type { Metadata } from "next";
import { FlowsGallery } from "./_gallery";

export const metadata: Metadata = {
	title: "User Story Gallery (Internal)",
	robots: { index: false, follow: false },
};

export default function FlowsPage() {
	return <FlowsGallery />;
}
