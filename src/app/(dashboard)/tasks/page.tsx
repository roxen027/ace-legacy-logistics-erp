import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createTaskAction, toggleTaskStatusAction } from "@/app/actions/tasks";
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
} from "lucide-react";

export default async function TasksPage() {
  const user = await requireAuth();

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      include: { assignee: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Operational Tasks & Follow-up Deadlines
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign load follow-ups, rate confirmations, shipper quote renewals, and compliance reviews.
          </p>
        </div>
      </div>

      {/* Create Task Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Create Internal Action Item
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createTaskAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              name="title"
              required
              placeholder="e.g. Call shipper for revised appointment window"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
            <select name="assigneeId" defaultValue={user.id} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Priority</label>
            <select name="priority" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Escalation</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Description / Action Details</label>
            <input
              name="description"
              placeholder="Context or load numbers..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              name="dueDate"
              type="date"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Assign Task
            </button>
          </div>
        </form>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Task Register
          </h3>
          <span className="text-xs text-slate-500">{tasks.length} Assigned Items</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {tasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";

            return (
              <div key={task.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <form action={async () => {
                    "use server";
                    await toggleTaskStatusAction(task.id, task.status);
                  }}>
                    <button
                      type="submit"
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </form>

                  <div className="min-w-0">
                    <div className={`font-bold text-slate-900 truncate ${isCompleted ? "line-through text-slate-400" : ""}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{task.description}</div>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>Assigned to: <strong className="text-slate-700">{task.assignee.firstName} {task.assignee.lastName}</strong></span>
                      {task.dueDate && (
                        <span>Due: <strong className="text-slate-700">{new Date(task.dueDate).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.priority === "URGENT"
                      ? "bg-red-100 text-red-800"
                      : task.priority === "HIGH"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
