import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createEmployeeAction } from "@/app/actions/hr";
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  Building,
} from "lucide-react";

export default async function EmployeesPage() {
  const currentUser = await requireRole(["SUPER_ADMIN", "HR_MANAGER"]);

  const [employees, departments] = await Promise.all([
    prisma.user.findMany({
      include: {
        department: true,
        branch: true,
        shift: true,
      },
      orderBy: { employeeId: "asc" },
    }),
    prisma.department.findMany(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Employee Directory & HR Roles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company personnel, role-based authorization portals, shifts, and compensation records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            {employees.length} Active Personnel
          </span>
        </div>
      </div>

      {/* Add Employee Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" /> Onboard New Employee / Assign Portal Role
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createEmployeeAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">First Name</label>
            <input
              name="firstName"
              required
              placeholder="e.g. John"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
            <input
              name="lastName"
              required
              placeholder="e.g. Doe"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="jdoe@acelegacyservices.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Portal Role</label>
            <select name="role" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <option value="SALES_AGENT">Sales Agent</option>
              <option value="DISPATCHER">Dispatcher / Fleet Agent</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="ACCOUNTANT">Billing Accountant</option>
              <option value="ACCOUNTING_MANAGER">Accounting Manager</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="SUPER_ADMIN">Super Admin / Owner</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
            <input
              name="title"
              placeholder="e.g. Freight Broker Trainee"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <select name="departmentId" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Base Salary ($/yr)</label>
            <input
              name="baseSalary"
              type="number"
              placeholder="65000"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hourly Rate ($/hr)</label>
            <input
              name="hourlyRate"
              type="number"
              step="0.5"
              placeholder="30.00"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Create Employee Account
            </button>
          </div>
        </form>
      </div>

      {/* Employees Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Registered Personnel & Role Permissions
          </h3>
          <span className="text-xs text-slate-500">Sorted by Employee ID</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">ID / Name</th>
                <th className="px-4 py-3">Role Portal</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3 text-right">Compensation</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                    <div className="text-[10px] text-blue-600 font-mono font-bold">{emp.employeeId}</div>
                    <div className="text-[11px] text-slate-400">{emp.title || "Staff"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      <Shield className="w-3 h-3 text-blue-600" />
                      {emp.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{emp.department?.name || "General"}</div>
                    <div className="text-[10px] text-slate-400">{emp.branch?.name || "Dallas HQ"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800 flex items-center gap-1 font-mono text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" /> {emp.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{emp.shift?.name || "Standard Day"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <div className="font-bold text-slate-900">${emp.baseSalary?.toLocaleString()}/yr</div>
                    <div className="text-[10px] text-slate-400">${emp.hourlyRate?.toFixed(2)}/hr</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
