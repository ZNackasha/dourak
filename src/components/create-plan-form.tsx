"use client";

import { createPlanAction } from "@/app/actions/schedule";
import { useFormStatus } from "react-dom";
import { useState, useEffect, useActionState } from "react";
import { toast } from "sonner";

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			disabled={pending}
			className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{pending ? "Creating..." : "Create Plan"}
		</button>
	);
}

export function CreatePlanForm({ scheduleId }: { scheduleId: string }) {
	const [state, formAction] = useActionState(createPlanAction, null);

	useEffect(() => {
		console.log("Form state updated:", state);
		if (state?.message) {
			if (state.error) {
				toast.error(state.message, {
					description: state.error,
					duration: 5000,
				});
			} else {
				toast.success(state.message);
			}
		}
	}, [state]);

	return (
		<form
			action={(formData) => {
				console.log("Submitting form...");
				formAction(formData);
			}}
			className="space-y-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
		>
			<input type="hidden" name="scheduleId" value={scheduleId} />

			{state?.message && (
				<div className={`p-4 rounded-lg ${state.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
					<p className="font-medium">{state.message}</p>
					{state.error && <p className="text-sm mt-1 opacity-90">{state.error}</p>}
				</div>
			)}

			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-zinc-700 mb-1"
				>
					Plan Name
				</label>
				<input
					type="text"
					name="name"
					id="name"
					required
					placeholder="e.g. December 2025"
					className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div>
					<label
						htmlFor="startDate"
						className="block text-sm font-medium text-zinc-700 mb-1"
					>
						Start Date
					</label>
					<input
						type="date"
						name="startDate"
						id="startDate"
						required
						className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label
						htmlFor="endDate"
						className="block text-sm font-medium text-zinc-700 mb-1"
					>
						End Date
					</label>
					<input
						type="date"
						name="endDate"
						id="endDate"
						required
						className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					/>
				</div>
			</div>

			<div className="pt-4 flex justify-end gap-3">
				<a
					href={`/schedules/${scheduleId}`}
					className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
				>
					Cancel
				</a>
				<SubmitButton />
			</div>
		</form>
	);
}
