"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminUserEditModal, type AdminEditableUser } from "@/components/admin-user-edit-modal";

type AdminRiskyUsersTableProps = {
  initialUsers: AdminEditableUser[];
};

export function AdminRiskyUsersTable({ initialUsers }: AdminRiskyUsersTableProps) {
  const [users, setUsers] = useState<AdminEditableUser[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<AdminEditableUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenModal(user: AdminEditableUser) {
    setSelectedUser(user);
    setIsModalOpen(true);
  }

  function handleUserUpdated(updatedUser: AdminEditableUser) {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)),
    );
    setSelectedUser(updatedUser);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="p-4 font-bold text-slate-600">Kullanıcı</th>
              <th className="p-4 font-bold text-slate-600">İhlal Puanı (Strike)</th>
              <th className="p-4 font-bold text-slate-600">Mevcut Durum</th>
              <th className="p-4 font-bold text-slate-600">Rol</th>
              <th className="p-4 font-bold text-slate-600 text-right">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                  Harika! Şu an riskli veya uyarı almış bir kullanıcı yok. 🎉
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{user.full_name || "İsimsiz"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black ${
                        (user.social_safety_strike_count ?? 0) >= 3
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      ⚠️ {user.social_safety_strike_count ?? 0} İhlal
                    </span>
                  </td>
                  <td className="p-4">
                    {user.social_interactions_blocked ? (
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700">
                        🚫 Etkileşim Engelli
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                        ✓ Normal
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-600 capitalize">
                    {user.role}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(user)}
                        className="tap-scale rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100 border border-violet-200 transition"
                      >
                        ⚙️ Özellikleri Yönet
                      </button>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="tap-scale rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 border border-violet-200"
                      >
                        360° Sayfa ↗
                      </Link>
                      <Link
                        href={`/profile/${user.id}`}
                        target="_blank"
                        className="tap-scale rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                      >
                        Profili Aç ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminUserEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
    </>
  );
}
