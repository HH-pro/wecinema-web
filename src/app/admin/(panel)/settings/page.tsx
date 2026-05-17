"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, User, Lock, Shield, Plus, Trash2,
  Check, X, CheckCircle, XCircle,
} from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import * as adminService from "@/features/admin/api/adminService";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { AdminUser } from "@/features/admin/types/admin.types";
import toast from "react-hot-toast";

function Section({ title, icon: Icon, iconColor, children }: {
  title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6"
    >
      <h2 className="text-base font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-purple-500 font-mono transition-all";

export default function SettingsPage() {
  const { authUser, refreshUser } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [profileForm, setProfileForm] = useState({ username: "", email: "" });
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [adminForm, setAdminForm] = useState({
    username: "", email: "", password: "", confirmPassword: "", dob: "", isAdmin: false, isSubAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setProfileForm({ username: authUser.username, email: authUser.email });
    }
    if (authUser?.isAdmin) fetchAdminUsers();
  }, [authUser]);

  const fetchAdminUsers = async () => {
    try {
      const res = await adminService.getPrivilegedUsers();
      setAdminUsers(res?.users ?? []);
    } catch {
      // ignore
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setLoading(true);
    try {
      await api.put(`/user/edit/${authUser._id}`, { username: profileForm.username, email: profileForm.email });
      await refreshUser();
      toast.success("Profile updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.put("/user/change-password", {
        email: authUser?.email,
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed");
    } catch {
      toast.error("Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!adminForm.isAdmin && !adminForm.isSubAdmin) {
      toast.error("Select at least one role");
      return;
    }
    setLoading(true);
    try {
      await adminService.adminRegister({
        email: adminForm.email,
        password: adminForm.password,
        username: adminForm.username,
        dob: adminForm.dob,
        isAdmin: adminForm.isAdmin,
        isSubAdmin: adminForm.isSubAdmin,
      });
      setAdminForm({ username: "", email: "", password: "", confirmPassword: "", dob: "", isAdmin: false, isSubAdmin: false });
      toast.success("Admin registered");
      fetchAdminUsers();
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await adminService.removePrivileges(userId, { removeAll: true });
      toast.success("Privileges removed");
      fetchAdminUsers();
    } catch {
      toast.error("Failed to remove privileges");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--ap-text-2)]" />
          Settings
        </h1>
        <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">Manage your account and admin configuration</p>
      </div>

      {/* Profile */}
      <Section title="Update Profile" icon={User} iconColor="text-blue-400">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Field label="Username">
            <input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className={inputCls} required />
          </Field>
          <Field label="Email">
            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className={inputCls} required />
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={Lock} iconColor="text-purple-400">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { label: "Current Password", key: "currentPassword" },
            { label: "New Password", key: "newPassword" },
            { label: "Confirm New Password", key: "confirmPassword" },
          ].map(({ label, key }) => (
            <Field key={key} label={label}>
              <input
                type="password"
                value={pwdForm[key as keyof typeof pwdForm]}
                onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
          ))}
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>
      </Section>

      {/* Admin management — full admin only */}
      {authUser?.isAdmin && (
        <Section title="Admin User Management" icon={Shield} iconColor="text-cyan-400">
          {/* Register new admin form */}
          <form onSubmit={handleRegisterAdmin} className="space-y-4 pb-6 border-b border-[var(--ap-border)] mb-6">
            <h3 className="text-sm font-medium text-[var(--ap-text-2)] font-mono">Register New Admin / SubAdmin</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Username", key: "username", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Date of Birth", key: "dob", type: "date" },
                { label: "Password", key: "password", type: "password" },
                { label: "Confirm Password", key: "confirmPassword", type: "password" },
              ].map(({ label, key, type }) => (
                <Field key={key} label={label}>
                  <input
                    type={type}
                    value={adminForm[key as keyof typeof adminForm] as string}
                    onChange={(e) => setAdminForm({ ...adminForm, [key]: e.target.value })}
                    className={inputCls}
                    required
                  />
                </Field>
              ))}
            </div>
            <div className="flex items-center gap-6">
              {[
                { key: "isAdmin", label: "Admin", color: "accent-blue-600" },
                { key: "isSubAdmin", label: "SubAdmin", color: "accent-purple-600" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminForm[key as "isAdmin" | "isSubAdmin"]}
                    onChange={() => setAdminForm({ ...adminForm, [key]: !adminForm[key as "isAdmin" | "isSubAdmin"] })}
                    className="w-4 h-4 rounded border-[var(--ap-border)] bg-[var(--ap-surface-alt)]"
                  />
                  <span className="text-sm text-[var(--ap-text-2)] font-mono">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Register
              </button>
            </div>
          </form>

          {/* Existing privileged users */}
          <div>
            <h3 className="text-sm font-medium text-[var(--ap-text-2)] font-mono mb-4">
              Privileged Users ({adminUsers.length})
            </h3>
            {adminUsers.length === 0 ? (
              <p className="text-xs text-[var(--ap-text-3)] font-mono text-center py-4">No privileged users found</p>
            ) : (
              <div className="space-y-3">
                {adminUsers.map((admin) => (
                  <motion.div
                    key={admin._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 bg-[var(--ap-surface-alt)] rounded-xl border border-[var(--ap-border)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ap-text)] font-mono truncate">{admin.username}</p>
                      <p className="text-xs text-[var(--ap-text-3)] font-mono">{admin.email}</p>
                      <div className="flex gap-1.5 mt-1">
                        {admin.isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border border-blue-500/30 text-blue-400 bg-blue-500/10">Admin</span>
                        )}
                        {admin.isSubAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border border-purple-500/30 text-purple-400 bg-purple-500/10">SubAdmin</span>
                        )}
                      </div>
                    </div>
                    {admin._id !== authUser?._id && (
                      <button
                        onClick={() => handleRemoveAdmin(admin._id)}
                        className="ml-4 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
