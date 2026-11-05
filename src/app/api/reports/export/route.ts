import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [brokerageLoads, dispatchLoads] = await Promise.all([
    prisma.brokerageLoad.findMany({ include: { customer: true, carrier: true } }),
    prisma.dispatchLoad.findMany({ include: { client: true, truck: true } }),
  ]);

  let csvContent = "Division,Transaction Number,Entity/Partner,Equipment,Total Miles,Gross Amount,Cost/Pay,Ace Legacy Revenue/Margin,Status\n";

  brokerageLoads.forEach((b) => {
    csvContent += `Brokerage,${b.loadNumber},"${b.customer.name}",${b.equipment},${b.totalMiles},${b.customerRate},${b.carrierRate},${b.grossMargin},${b.executionStatus}\n`;
  });

  dispatchLoads.forEach((d) => {
    csvContent += `Dispatch,${d.dispatchNumber},"${d.client.companyName}",${d.truck.trailerType},${d.loadedMiles},${d.grossFreightRate},0,${d.calculatedFee},${d.status}\n`;
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ace_legacy_report_${new Date().toISOString().substring(0, 10)}.csv"`,
    },
  });
}
