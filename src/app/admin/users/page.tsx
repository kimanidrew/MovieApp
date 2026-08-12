"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X, Loader2, UserPlus, Shield, ShieldCheck, ShieldAlert } from "lucide-react";

type UserItem = {
  id: string;
  email: string;
  role: string;
  isCreator: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    profiles: number;
    subscriptions: number;
    sessions: number;
  };
};

const ROLE_OPTIONS = ["USER", "MODERATOR", "CONTENT_MANAGER", "ADMIN", "SUPERADMIN"];
const ROLE_COLORS: Record<string, { bg: string; color: string; icon: any }> = {
  USER: { bg: "rgba(107, 114, 128, 0.15)", color: "#9ca3af", icon: Shield },
  MODERATOR: { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", icon: ShieldCheck },
  CONTENT_MANAGER: { bg: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", icon: ShieldCheck },
  ADMIN: { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", icon: ShieldAlert },
  SUPERADMIN: { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", icon: ShieldAlert },
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newIsCreator, setNewIsCreator] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsCreator, setEditIsCreator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        ...(query ? { q: query } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter]);

  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(delay);
  }, [fetchUsers]);

  const createUser = async () => {
    if (!newEmail || !newPassword) {
      alert("Email and password are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole, isCreator: newIsCreator }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("USER");
      setNewIsCreator(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item: UserItem) => {
    setEditingId(item.id);
    setEditRole(item.role);
    setEditIsActive(item.isActive);
    setEditIsCreator(item.isCreator);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: editRole, isActive: editIsActive, isCreator: editIsCreator }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This will soft-delete their account.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>User Management</h1>
            <p style={{ color: "#71717a", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
              {total} registered users
            </p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "#10b981", color: "#fff", padding: "0.6rem 1.25rem",
            borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600,
            border: "none", cursor: "pointer"
          }}>
            <UserPlus size={16} /> {showCreate ? "Cancel" : "Create User"}
          </button>
        </div>

        {/* Create User Form */}
        {showCreate && (
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem 0" }}>Create New User</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem" }}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{ width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem" }}>Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem" }}>Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", cursor: "pointer" }}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#a1a1aa", cursor: "pointer" }}>
                  <input type="checkbox" checked={newIsCreator} onChange={(e) => setNewIsCreator(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  Creator Account
                </label>
              </div>
            </div>
            <button onClick={createUser} disabled={creating} style={{
              marginTop: "1rem", background: "#10b981", color: "#fff", border: "none",
              borderRadius: "0.5rem", padding: "0.6rem 1.5rem", fontSize: "0.875rem",
              fontWeight: 600, cursor: creating ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.5rem"
            }}>
              {creating ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={16} />}
              {creating ? "Creating..." : "Create User"}
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by email..."
              style={{
                width: "100%", background: "#18181b", border: "1px solid #27272a",
                borderRadius: "0.5rem", padding: "0.6rem 0.75rem 0.6rem 2.5rem",
                color: "#fafafa", fontSize: "0.875rem", outline: "none"
              }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", cursor: "pointer" }}
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #27272a", borderTopColor: "#e11d48", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#09090b", borderBottom: "1px solid #27272a" }}>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>User</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Role</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Profiles</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Subscriptions</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Created</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", color: "#71717a", fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#71717a" }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.USER;
                      const RoleIcon = roleStyle.icon;
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #27272a" }}>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 600, color: "#a1a1aa" }}>
                                {item.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{item.email}</div>
                                {item.isCreator && <div style={{ color: "#f59e0b", fontSize: "0.7rem" }}>Creator</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            {editingId === item.id ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: "0.25rem", padding: "0.3rem 0.5rem", color: "#fafafa", fontSize: "0.8rem" }}
                              >
                                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <span style={{ padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, background: roleStyle.bg, color: roleStyle.color, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                <RoleIcon size={12} /> {item.role}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            {editingId === item.id ? (
                              <select
                                value={editIsActive ? "ACTIVE" : "INACTIVE"}
                                onChange={(e) => setEditIsActive(e.target.value === "ACTIVE")}
                                style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: "0.25rem", padding: "0.3rem 0.5rem", color: "#fafafa", fontSize: "0.8rem" }}
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                              </select>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: item.isActive ? "#22c55e" : "#ef4444", fontSize: "0.8rem" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.isActive ? "#22c55e" : "#ef4444" }} />
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{item._count.profiles}</td>
                          <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{item._count.subscriptions}</td>
                          <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>
                            {editingId === item.id ? (
                              <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                                <button onClick={() => saveEdit(item.id)} disabled={saving} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />} Save
                                </button>
                                <button onClick={() => setEditingId(null)} style={{ background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                  <X size={14} /> Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                                <button onClick={() => startEdit(item)} style={{ background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                  <Pencil size={14} /> Edit
                                </button>
                                <button onClick={() => deleteUser(item.id)} disabled={deletingId === item.id} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                  {deletingId === item.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />} Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#71717a", fontSize: "0.85rem" }}>
                  Page {page} of {totalPages} · {total} users
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.75rem", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.75rem", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}