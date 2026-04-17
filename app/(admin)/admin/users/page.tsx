"use client";

import { useEffect, useState, useCallback } from "react";

type ProgressEntry = {
  language: string;
  currentLevel: string;
  xp: number;
  totalPassages: number;
};

type UserWithStats = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  approvedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    passages: number;
    attempts: number;
    vocabularyWords: number;
  };
  progress: ProgressEntry[];
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function doAction(id: string, action: string) {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await fetchUsers();
    setBusyId(null);
  }

  async function doDelete(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await fetchUsers();
    setBusyId(null);
  }

  const pending = users.filter((u) => !u.isActive && u.role !== "ADMIN");
  const active = users.filter((u) => u.isActive);
  const inactive = users.filter((u) => !u.isActive && u.role === "ADMIN");

  if (loading) {
    return <p className="text-gray-500">Loading users…</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">User Management</h2>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-amber-700 mb-3">
            Pending Approval ({pending.length})
          </h3>
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-100 text-amber-800">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Registered</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 font-medium">{u.email}</td>
                    <td className="px-4 py-2 text-gray-600">{u.name ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => doAction(u.id, "approve")}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setConfirmDelete(u.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        Reject & Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Active users */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Active Users ({active.length})
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Languages</th>
                <th className="px-4 py-2 text-left">Passages</th>
                <th className="px-4 py-2 text-left">Vocab</th>
                <th className="px-4 py-2 text-left">Last Login</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{u.email}</td>
                  <td className="px-4 py-2 text-gray-600">{u.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.progress.length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {u.progress.map((p) => (
                          <div key={p.language} className="text-xs text-gray-600">
                            <span className="font-medium uppercase">{p.language}</span>{" "}
                            {p.currentLevel} · {p.xp} XP · {p.totalPassages}p
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{u._count.passages}</td>
                  <td className="px-4 py-2 text-gray-600">{u._count.vocabularyWords}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {u.role !== "ADMIN" && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => doAction(u.id, "promote")}
                          title="Make Admin"
                          className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs disabled:opacity-50"
                        >
                          Make Admin
                        </button>
                      )}
                      <button
                        disabled={busyId === u.id}
                        onClick={() => doAction(u.id, "deactivate")}
                        className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-xs disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setConfirmDelete(u.id)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deactivated (non-admin inactive) */}
      {inactive.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-500 mb-3">
            Deactivated ({inactive.length})
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inactive.map((u) => (
                  <tr key={u.id} className="opacity-60">
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => doAction(u.id, "approve")}
                        className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs disabled:opacity-50"
                      >
                        Re-activate
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => setConfirmDelete(u.id)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete user?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This will permanently delete the user and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                disabled={busyId === confirmDelete}
                onClick={() => doDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
