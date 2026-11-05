import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { clockInAction, clockOutAction, submitLeaveRequestAction } from "@/app/actions/hr";
import {
  Clock,
  Play,
  Square,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  Send
} from "lucide-react";

export default async function AttendancePage() {
  const user = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Active attendance session
  const activeAttendance = await prisma.attendance.findFirst({
    where: {
      userId: user.id,
      date: today,
    },
    orderBy: { createdAt: "desc" },
  });

  const isClockedIn = !!activeAttendance && !activeAttendance.clockOut;

  // Monthly timesheets for user (or all if HR/Admin)
  const isHR = ["SUPER_ADMIN", "HR_MANAGER"].includes(user.role);
  const attendances = await prisma.attendance.findMany({
    where: isHR ? {} : { userId: user.id },
    include: { user: true },
    orderBy: { clockIn: "desc" },
    take: 20,
  });

  const leaves = await prisma.leaveRequest.findMany({
    where: isHR ? {} : { userId: user.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Time & Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Web time clock, scheduled shift enforcement, timesheet auditing, and leave tracking.
          </p>
        </div>
      </div>

      {/* Clock Widget + Shift Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Clock In / Out Action Box */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Web Punch
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isClockedIn ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                {isClockedIn ? "CURRENTLY CLOCKED IN" : "CLOCKED OUT"}
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            
            {activeAttendance && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex flex-wrap gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clocked In</span>
                  <span className="font-bold text-slate-900">
                    {new Date(activeAttendance.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {activeAttendance.clockOut && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clocked Out</span>
                    <span className="font-bold text-slate-900">
                      {new Date(activeAttendance.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Hours</span>
                  <span className="font-bold text-blue-600">{activeAttendance.totalHours} hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-bold text-emerald-700">{activeAttendance.status}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!isClockedIn ? (
              <form action={async () => {
                "use server";
                await clockInAction();
              }}>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Clock In Now
                </button>
              </form>
            ) : (
              <form action={async () => {
                "use server";
                await clockOutAction(30); // 30 min default lunch break
              }}>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-white" /> Clock Out (End Shift)
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Shift Details & Policy */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Assigned Shift Policy
            </div>
            <div className="font-bold text-sm text-slate-900">Corporate Standard Shift</div>
            <div className="text-xs text-slate-600 mt-1">08:00 AM – 05:00 PM (US Central)</div>
            
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Grace Period:</span>
                <span className="font-semibold text-slate-800">15 minutes</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Standard Lunch:</span>
                <span className="font-semibold text-slate-800">60 minutes</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Overtime Threshold:</span>
                <span className="font-semibold text-slate-800">&gt; 8.0 hrs / day</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            Punches are tagged with UTC server timestamps and verified IP address. Corrections require manager approval.
          </div>
        </div>
      </div>

      {/* Timesheet Table & Leave Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timesheets Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              {isHR ? "Company Attendance Audit Log" : "My Recent Timesheets"}
            </h3>
            <span className="text-[11px] text-slate-500">{attendances.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
                <tr>
                  {isHR && <th className="px-4 py-2.5">Employee</th>}
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">In</th>
                  <th className="px-4 py-2.5">Out</th>
                  <th className="px-4 py-2.5">Total Hrs</th>
                  <th className="px-4 py-2.5">OT</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    {isHR && (
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-900">{att.user.firstName} {att.user.lastName}</div>
                        <div className="text-[10px] text-slate-400">{att.user.employeeId}</div>
                      </td>
                    )}
                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                      {new Date(att.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      {new Date(att.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5">
                      {att.clockOut
                        ? new Date(att.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Active"}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-blue-600">{att.totalHours}</td>
                    <td className="px-4 py-2.5">{att.overtimeHours > 0 ? `+${att.overtimeHours}` : "-"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        att.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : att.status === "LATE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Requests & Application */}
        <div className="lg:col-span-4 space-y-5">
          {/* Apply Leave Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Apply For Leave
            </h3>
            <form
              action={async (formData: FormData) => {
                "use server";
                await submitLeaveRequestAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Leave Type</label>
                <select
                  name="leaveType"
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Vacation</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason / Notes</label>
                <textarea
                  name="reason"
                  rows={2}
                  required
                  placeholder="Reason for leave..."
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Request
              </button>
            </form>
          </div>

          {/* Pending / Approved Leaves */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Leave History & Approvals
            </h4>
            <div className="space-y-2">
              {leaves.map((l) => (
                <div key={l.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{l.leaveType} ({l.totalDays} days)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
