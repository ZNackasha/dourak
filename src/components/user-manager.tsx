"use client";

import { useState } from "react";
import { updateUserRoles } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Role = {
	id: string;
	name: string;
	color: string | null;
};

type UserRole = {
	roleId: string;
	role: Role;
};

type User = {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	roles: UserRole[];
	isOwner: boolean;
	isAdmin: boolean;
};

export function UserManager({
	scheduleId,
	initialUsers,
	availableRoles,
}: {
	scheduleId: string;
	initialUsers: User[];
	availableRoles: Role[];
}) {
	const [users, setUsers] = useState(initialUsers);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
	const [isSaving, setIsSaving] = useState(false);
	const router = useRouter();

	const startEditing = (user: User) => {
		setEditingUserId(user.id);
		setSelectedRoleIds(new Set(user.roles.map((r) => r.roleId)));
	};

	const cancelEditing = () => {
		setEditingUserId(null);
		setSelectedRoleIds(new Set());
	};

	const toggleRole = (roleId: string) => {
		const newSet = new Set(selectedRoleIds);
		if (newSet.has(roleId)) {
			newSet.delete(roleId);
		} else {
			newSet.add(roleId);
		}
		setSelectedRoleIds(newSet);
	};

	const saveRoles = async () => {
		if (!editingUserId) return;

		setIsSaving(true);
		try {
			await updateUserRoles(scheduleId, editingUserId, Array.from(selectedRoleIds));

			// Optimistic update
			setUsers((prev) =>
				prev.map((u) => {
					if (u.id === editingUserId) {
						return {
							...u,
							roles: availableRoles
								.filter((r) => selectedRoleIds.has(r.id))
								.map((r) => ({ roleId: r.id, role: r })),
						};
					}
					return u;
				})
			);

			setEditingUserId(null);
			router.refresh();
			toast.success("Roles updated successfully");
		} catch (error) {
			console.error("Failed to update roles", error);
			toast.error("Failed to update roles");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-white shadow-sm rounded-lg border border-zinc-200 overflow-hidden">
			<ul className="divide-y divide-zinc-200">
				{users.map((user) => (
					<li key={user.id} className="p-4 sm:p-6 hover:bg-zinc-50 transition-colors">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								{user.image ? (
									<img
										src={user.image}
										alt={user.name || "User"}
										className="h-10 w-10 rounded-full bg-zinc-100"
									/>
								) : (
									<div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
										{user.name?.[0] || user.email?.[0] || "?"}
									</div>
								)}
								<div>
									<h3 className="text-sm font-medium text-zinc-900">
										{user.name || "Unknown Name"}
										{user.isOwner && (
											<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
												Owner
											</span>
										)}
										{user.isAdmin && !user.isOwner && (
											<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
												Admin
											</span>
										)}
									</h3>
									<p className="text-sm text-zinc-500">{user.email}</p>
								</div>
							</div>

							<div className="flex-1 sm:text-right">
								{editingUserId === user.id ? (
									<div className="flex flex-col sm:items-end gap-2">
										<div className="flex flex-wrap gap-2 justify-end">
											{availableRoles.map((role) => (
												<button
													key={role.id}
													onClick={() => toggleRole(role.id)}
													className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedRoleIds.has(role.id)
														? "bg-indigo-100 text-indigo-800 border-indigo-200"
														: "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
														}`}
												>
													{role.name}
												</button>
											))}
										</div>
										<div className="flex gap-2 justify-end mt-2">
											<button
												onClick={cancelEditing}
												disabled={isSaving}
												className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-1"
											>
												Cancel
											</button>
											<button
												onClick={saveRoles}
												disabled={isSaving}
												className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50"
											>
												{isSaving ? "Saving..." : "Save"}
											</button>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-between sm:justify-end gap-4">
										<div className="flex flex-wrap gap-2 justify-end">
											{user.roles.length > 0 ? (
												user.roles.map((ur) => (
													<span
														key={ur.roleId}
														className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
														style={{
															backgroundColor: ur.role.color ? `${ur.role.color}20` : undefined,
															color: ur.role.color || undefined,
														}}
													>
														{ur.role.name}
													</span>
												))
											) : (
												<span className="text-sm text-zinc-400 italic">No roles assigned</span>
											)}
										</div>
										<button
											onClick={() => startEditing(user)}
											className="text-sm text-indigo-600 hover:text-indigo-900 font-medium whitespace-nowrap"
										>
											Edit Roles
										</button>
									</div>
								)}
							</div>
						</div>
					</li>
				))}
				{users.length === 0 && (
					<li className="p-8 text-center text-zinc-500">
						No users found for this schedule.
					</li>
				)}
			</ul>
		</div>
	);
}
