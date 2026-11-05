import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createTruckAction } from "@/app/actions/dispatch";
import Link from "next/link";
import {
  Truck,
  Plus,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";

export default async function FleetPage() {
  await requireRole([
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
  ]);

  const [trucks, clients] = await Promise.all([
    prisma.truck.findMany({
      include: {
        client: true,
        drivers: true,
        dispatchLoads: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { unitNumber: "asc" },
    }),
    prisma.dispatchClient.findMany({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" /> Fleet Units & Equipment Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track client power units, trailers, home base locations, minimum target rates per mile, and availability.
          </p>
        </div>
      </div>

      {/* Add Truck Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" /> Register Client Power Unit / Trailer
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createTruckAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch Client Owner</label>
            <select name="clientId" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} ({c.clientCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unit / Truck Number</label>
            <input
              name="unitNumber"
              required
              placeholder="e.g. TRK-104"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trailer Equipment</label>
            <select name="trailerType" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              <option value="DRY_VAN">Dry Van (53ft)</option>
              <option value="REEFER">Reefer (Temperature Controlled)</option>
              <option value="FLATBED">Flatbed (48/53ft)</option>
              <option value="STEP_DECK">Step Deck</option>
              <option value="POWER_ONLY">Power Only</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trailer Unit Number</label>
            <input
              name="trailerNumber"
              placeholder="e.g. TL-5821"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Home Base City</label>
            <input
              name="homeBaseCity"
              placeholder="Dallas"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Home Base State</label>
            <input
              name="homeBaseState"
              placeholder="TX"
              maxLength={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Min $/Mile</label>
            <input
              name="minRatePerMile"
              type="number"
              step="0.05"
              defaultValue="2.30"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferred Lanes</label>
            <input
              name="preferredLanes"
              placeholder="Midwest to South, TX local"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Truck to Fleet
            </button>
          </div>
        </form>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {trucks.map((truck) => {
          const isUnderLoad = truck.status === "UNDER_LOAD";
          const assignedDriver = truck.drivers[0];

          return (
            <div
              key={truck.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono font-black text-base text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    {truck.unitNumber}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isUnderLoad
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {truck.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-800">{truck.client.companyName}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Trailer: {truck.trailerType.replace(/_/g, " ")} {truck.trailerNumber ? `(#${truck.trailerNumber})` : ""}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Assigned Driver:</span>
                    <span className="font-semibold text-slate-900">
                      {assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Min Rate Target:</span>
                    <span className="font-bold text-emerald-700">${truck.minRatePerMile.toFixed(2)} / mi</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Home Base:</span>
                    <span className="text-slate-800">{truck.homeBaseCity || "Dallas"}, {truck.homeBaseState || "TX"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Location:</span>
                    <span className="font-medium text-blue-600">{truck.currentLocation || "Base Hub"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Pref: {truck.preferredLanes || "Any Lane"}</span>
                <Link
                  href="/dispatch/loads"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Book Load <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
