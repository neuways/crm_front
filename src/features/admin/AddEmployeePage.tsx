import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Copy,
  AlertCircle,
  ShieldAlert,
  KeyRound,
  Shield,
  Briefcase,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import {
  CreateEmployeeInput,
  EmployeeProfile,
} from "../../types/user.types.js";
import { userService } from "../../services/user.service.js";
import { useAuth } from "../../context/AuthContext.js";
import { PropertiesSelect } from "./components/PropertiesSelect.js";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [role, setRole] = useState<"MANAGER" | "SALES">("SALES");
  const [managerId, setManagerId] = useState<string>("");
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Managers for supervisor dropdown
  const [managers, setManagers] = useState<EmployeeProfile[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success view state
  const [createdEmployee, setCreatedEmployee] =
    useState<EmployeeProfile | null>(null);
  const [createdPasswordSnapshot, setCreatedPasswordSnapshot] =
    useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch active managers for supervisor selection
  const fetchManagers = useCallback(async () => {
    try {
      setIsLoadingManagers(true);
      const res = await userService.listEmployees();
      if (res.success && Array.isArray(res.data)) {
        setManagers(res.data.filter((e) => e.role === "MANAGER" && e.isActive));
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleGeneratePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    const randomArray = new Uint32Array(14);
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(randomArray);
    } else {
      for (let i = 0; i < 14; i++) {
        randomArray[i] = Math.floor(Math.random() * 1000000);
      }
    }
    let pass = "";
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(randomArray[i] % chars.length);
    }
    setTemporaryPassword(pass);
    setShowPassword(true);
  };

  const handleCopyCredentials = async () => {
    if (!createdEmployee) return;
    const text = `Nueways CRM - Employee Account Provisioned\n\nName: ${createdEmployee.name}\nEmail: ${createdEmployee.email}\nMobile: ${createdEmployee.phone || "Not provided"}\nRole: ${createdEmployee.role}\nTemporary Password: ${createdPasswordSnapshot}\nSign-in URL: ${window.location.origin}/login\n\nNote: You can log in with this temporary password (you will be prompted to set your own private password), or sign in directly with Google using this email.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (
      !trimmedEmail ||
      !trimmedEmail.includes("@") ||
      !trimmedEmail.includes(".")
    ) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      const msg = "Mobile number is required.";
      setPhoneError(msg);
      setErrorMessage(msg);
      return;
    }
    if (!INDIAN_MOBILE_REGEX.test(trimmedPhone)) {
      const msg =
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
      setPhoneError(msg);
      setErrorMessage(msg);
      return;
    }

    if (!temporaryPassword || temporaryPassword.length < 8) {
      setErrorMessage("Temporary password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateEmployeeInput = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role,
        temporaryPassword,
        managerId:
          role === 'SALES' ? managerId || currentUser?.id || null : null,
        propertyIds: role === 'SALES' ? propertyIds : undefined,
      };

      const res = await userService.createEmployee(payload);
      if (!res.success || !res.data) {
        setErrorMessage(
          res.message || res.error || "Failed to create employee.",
        );
        return;
      }

      setCreatedEmployee(res.data);
      setCreatedPasswordSnapshot(temporaryPassword);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndReturn = () => {
    if (createdEmployee) {
      navigate("/admin/employees", {
        state: {
          successMessage: `Employee account created for ${createdEmployee.name} (${createdEmployee.email}).`,
        },
      });
    } else {
      navigate("/admin/employees");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-1">
            <span>Administration</span>
            <span className="text-edge">/</span>
            <button
              type="button"
              onClick={() => navigate("/admin/employees")}
              className="hover:text-brand-primary transition-colors cursor-pointer"
            >
              Employees
            </button>
            <span className="text-edge">/</span>
            <span className="text-content-primary">Add Employee</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
            Add Employee
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Provision and configure new Manager or Sales Agent credentials for
            the CRM platform.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="h-3.5 w-3.5" />}
          onClick={handleFinishAndReturn}
        >
          Back to Employees
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl">
        {createdEmployee ? (
          /* Success View */
          <Card className="p-6 sm:p-8 space-y-6 shadow-card">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-green-600 text-white rounded-full mt-0.5 shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-xs text-green-950 flex-1">
                <p className="text-sm font-bold mb-1">
                  Employee Account Created Successfully!
                </p>
                <p className="text-green-800 leading-relaxed">
                  The account has been provisioned with role{" "}
                  <span className="font-semibold text-green-950">
                    {createdEmployee.role}
                  </span>
                  . Deliver the temporary credentials securely to the employee.
                </p>
              </div>
            </div>

            <div className="bg-surface-subtle/50 border border-edge rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                <span className="text-content-muted font-medium">
                  Full Name
                </span>
                <span className="font-semibold text-content-primary text-sm">
                  {createdEmployee.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                <span className="text-content-muted font-medium">
                  Email Address
                </span>
                <span className="font-semibold text-content-primary font-mono">
                  {createdEmployee.email}
                </span>
              </div>
              {createdEmployee.phone && (
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                  <span className="text-content-muted font-medium">
                    Mobile Number
                  </span>
                  <span className="font-semibold text-content-primary font-mono">
                    {createdEmployee.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                <span className="text-content-muted font-medium">Role</span>
                <span className="font-bold text-brand-primary px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                  {createdEmployee.role}
                </span>
              </div>
              {createdEmployee.managerName && (
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                  <span className="text-content-muted font-medium">
                    Assigned Supervisor
                  </span>
                  <span className="font-semibold text-content-primary">
                    {createdEmployee.managerRole === "ADMIN"
                      ? `Direct Admin — ${createdEmployee.managerName}`
                      : createdEmployee.managerName}
                  </span>
                </div>
              )}
              {createdEmployee.assignedProperties &&
                createdEmployee.assignedProperties.length > 0 && (
                  <div className="flex items-center justify-between text-xs pb-2.5 border-b border-edge">
                    <span className="text-content-muted font-medium">
                      Assigned Properties
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                      {createdEmployee.assignedProperties.map((p) => (
                        <span
                          key={p.id}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-brand-primary border border-blue-200"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-content-muted font-medium">
                  Temporary Password
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 border border-slate-300 rounded shadow-xs text-sm">
                  {createdPasswordSnapshot}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <KeyRound className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Alternative Sign-In: </span>
                The employee can also sign in directly using{" "}
                <strong>Google Sign-In</strong> with{" "}
                <span className="font-medium underline">
                  {createdEmployee.email}
                </span>{" "}
                without needing to enter the temporary password.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-edge">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={
                  copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
                onClick={handleCopyCredentials}
                className="w-full sm:w-auto text-xs"
              >
                {copied ? "Credentials Copied!" : "Copy Credentials"}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFinishAndReturn}
                className="w-full sm:w-auto text-xs"
              >
                Return to Employees
              </Button>
            </div>
          </Card>
        ) : (
          /* Form View */
          <Card className="p-6 sm:p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-status-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1.5">
                  Full Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1.5">
                  Email Address <span className="text-status-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.sharma@gmail.com or company email"
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-[11px] text-content-muted mt-1.5 leading-relaxed">
                  Managers and Sales Agents may use pre-approved personal Gmail
                  or company accounts.
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1.5">
                  Mobile Number <span className="text-status-danger">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setPhone(digitsOnly);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={() => {
                    if (
                      phone.trim() &&
                      !INDIAN_MOBILE_REGEX.test(phone.trim())
                    ) {
                      setPhoneError(
                        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
                      );
                    }
                  }}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3.5 py-2.5 bg-surface-card border rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 font-mono ${
                    phoneError
                      ? "border-status-danger focus:ring-status-danger"
                      : "border-edge focus:ring-brand-primary"
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-status-danger mt-1.5 leading-relaxed">
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-[11px] text-content-muted mt-1.5 leading-relaxed">
                    10-digit Indian mobile number starting with 6, 7, 8, or 9.
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1.5">
                  Role Assignment <span className="text-status-danger">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${
                      role === "SALES"
                        ? "border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary"
                        : "border-edge hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Briefcase
                          className={`h-4 w-4 ${role === "SALES" ? "text-brand-primary" : "text-content-subtle"}`}
                        />
                        <span className="text-xs font-bold text-content-primary">
                          SALES
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="SALES"
                        checked={role === "SALES"}
                        onChange={() => setRole("SALES")}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                    </div>
                    <span className="text-[11px] text-content-muted leading-relaxed">
                      Sales Agent dashboard, pipeline follow-ups & round robin
                      assignment.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${
                      role === "MANAGER"
                        ? "border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary"
                        : "border-edge hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Shield
                          className={`h-4 w-4 ${role === "MANAGER" ? "text-brand-primary" : "text-content-subtle"}`}
                        />
                        <span className="text-xs font-bold text-content-primary">
                          MANAGER
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="MANAGER"
                        checked={role === "MANAGER"}
                        onChange={() => {
                          setRole("MANAGER");
                          setManagerId("");
                        }}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                    </div>
                    <span className="text-[11px] text-content-muted leading-relaxed">
                      Team supervision, meeting approvals & manager analytics.
                    </span>
                  </label>
                </div>

                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-content-secondary flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Policy:</strong> Initial ADMIN accounts
                    cannot be created here and must be bootstrapped via the
                    controlled server CLI.
                  </span>
                </div>
              </div>

              {/* Assigned Manager Dropdown (Only for Sales Agents) */}
              {role === "SALES" && (
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1.5">
                    Assign to Manager (Supervisor)
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    disabled={isLoadingManagers}
                    className="w-full px-3.5 py-2.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">
                      {currentUser?.name
                        ? `Direct Admin — ${currentUser.name} (Reports to Admin)`
                        : "Direct Admin (Reports to Admin)"}
                    </option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-content-muted mt-1 block">
                    Select a reporting manager, or leave as Direct Admin to assign
                    this sales agent directly under Admin oversight.
                  </span>
                </div>
              )}

              {/* Properties to Handle (Only for Sales Agents) */}
              {role === 'SALES' && (
                <PropertiesSelect
                  selectedPropertyIds={propertyIds}
                  onChange={setPropertyIds}
                  disabled={isSubmitting}
                />
              )}

              {/* Temporary Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-content-primary">
                    Initial Temporary Password{" "}
                    <span className="text-status-danger">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate Secure Password
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-surface-card border border-edge rounded-lg text-xs font-mono text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-content-subtle hover:text-content-primary cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-content-muted mt-1.5">
                  The employee will be required to set their permanent private
                  password upon first sign-in.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-edge">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFinishAndReturn}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<UserPlus className="h-3.5 w-3.5" />}
                  className="shadow-sm shadow-blue-500/20"
                >
                  Provision Account
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
