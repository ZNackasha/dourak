"use client";

import { useState } from "react";
import { syncScheduleEventsAction } from "@/app/actions/schedule";
import { useRouter } from "next/navigation";

export function SyncScheduleButton({ scheduleId }: { scheduleId: string }) {
	const [isSyncing, setIsSyncing] = useState(false);
	const router = useRouter();

	const handleSync = async () => {
		try {
			setIsSyncing(true);
			await syncScheduleEventsAction(scheduleId);
			router.refresh();
		} catch (error) {
			console.error("Failed to sync schedule:", error);
			alert("Failed to sync schedule");
		} finally {
			setIsSyncing(false);
		}
	};

	return (
		<button
			onClick={handleSync}
			disabled={isSyncing}
			className="bg-white text-zinc-700 border border-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
		>
			{isSyncing ? (
				<>
					<svg className="animate-spin h-4 w-4 text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Syncing...
				</>
			) : (
				<>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Sync Events
				</>
			)}
		</button>
	);
}
