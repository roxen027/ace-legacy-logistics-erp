import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Ace Legacy Services database seed...");

  // 1. Company & Branches
  const company = await prisma.company.upsert({
    where: { id: "ace-company-main" },
    update: {},
    create: {
      id: "ace-company-main",
      legalName: "Ace Legacy Services LLC",
      dba: "Ace Legacy Services",
      taxId: "84-2938471",
      mcNumber: "MC-1094821",
      dotNumber: "USDOT-3928172",
      address: "1200 Logistics Blvd, Suite 400, Dallas, TX 75201",
      phone: "+1 (214) 555-0199",
      email: "operations@acelegacyservices.com",
      website: "https://www.acelegacyservices.com",
      defaultCurrency: "USD",
      timezone: "America/Chicago",
    },
  });

  const branchDallas = await prisma.branch.upsert({
    where: { code: "DAL-HQ" },
    update: {},
    create: {
      companyId: company.id,
      name: "Dallas Headquarters",
      code: "DAL-HQ",
      city: "Dallas",
      state: "TX",
      timezone: "America/Chicago",
    },
  });

  const branchChicago = await prisma.branch.upsert({
    where: { code: "CHI-LOG" },
    update: {},
    create: {
      companyId: company.id,
      name: "Chicago Regional Logistics",
      code: "CHI-LOG",
      city: "Chicago",
      state: "IL",
      timezone: "America/Chicago",
    },
  });

  // 2. Departments
  const deptExec = await prisma.department.create({
    data: { companyId: company.id, name: "Executive Management", description: "Company leadership & ownership" },
  });
  const deptHR = await prisma.department.create({
    data: { companyId: company.id, name: "Human Resources", description: "People, recruitment & attendance" },
  });
  const deptSales = await prisma.department.create({
    data: { companyId: company.id, name: "Sales & Brokerage CRM", description: "Shipper acquisition & quoting" },
  });
  const deptOps = await prisma.department.create({
    data: { companyId: company.id, name: "Freight Brokerage Operations", description: "Carrier sourcing, coverage & tracking" },
  });
  const deptDispatch = await prisma.department.create({
    data: { companyId: company.id, name: "Truck Dispatching Division", description: "Owner-operator fleet services" },
  });
  const deptFinance = await prisma.department.create({
    data: { companyId: company.id, name: "Accounting & Finance", description: "AR, AP, dispatch billing & commissions" },
  });

  // 3. Shifts
  const dayShift = await prisma.shift.create({
    data: {
      name: "Corporate Standard (8:00 AM - 5:00 PM)",
      startTime: "08:00",
      endTime: "17:00",
      timezone: "America/Chicago",
      graceMinutes: 15,
      breakMinutes: 60,
    },
  });

  const nightShift = await prisma.shift.create({
    data: {
      name: "Dispatch Night Operations (5:00 PM - 2:00 AM)",
      startTime: "17:00",
      endTime: "02:00",
      timezone: "America/Chicago",
      graceMinutes: 15,
      breakMinutes: 60,
    },
  });

  // 4. Default Users for each Role (Password: "admin123")
  const defaultPassword = await bcrypt.hash("admin123", 10);

  const usersData = [
    {
      employeeId: "EMP-1001",
      firstName: "Marcus",
      lastName: "Sterling",
      email: "admin@acelegacyservices.com",
      role: "SUPER_ADMIN",
      title: "President & Founder",
      departmentId: deptExec.id,
      branchId: branchDallas.id,
      hourlyRate: 85.0,
      baseSalary: 160000.0,
    },
    {
      employeeId: "EMP-1002",
      firstName: "Elena",
      lastName: "Rios",
      email: "hr@acelegacyservices.com",
      role: "HR_MANAGER",
      title: "Director of People & Operations",
      departmentId: deptHR.id,
      branchId: branchDallas.id,
      hourlyRate: 42.0,
      baseSalary: 85000.0,
    },
    {
      employeeId: "EMP-1003",
      firstName: "David",
      lastName: "Vance",
      email: "sales.manager@acelegacyservices.com",
      role: "SALES_MANAGER",
      title: "VP of Freight Sales",
      departmentId: deptSales.id,
      branchId: branchDallas.id,
      hourlyRate: 50.0,
      baseSalary: 105000.0,
    },
    {
      employeeId: "EMP-1004",
      firstName: "Jordan",
      lastName: "Miller",
      email: "sales.agent@acelegacyservices.com",
      role: "SALES_AGENT",
      title: "Senior Freight Sales Executive",
      departmentId: deptSales.id,
      branchId: branchDallas.id,
      hourlyRate: 28.0,
      baseSalary: 55000.0,
    },
    {
      employeeId: "EMP-1005",
      firstName: "Caleb",
      lastName: "Brooks",
      email: "ops.manager@acelegacyservices.com",
      role: "OPERATIONS_MANAGER",
      title: "Brokerage Operations Manager",
      departmentId: deptOps.id,
      branchId: branchChicago.id,
      hourlyRate: 45.0,
      baseSalary: 92000.0,
    },
    {
      employeeId: "EMP-1006",
      firstName: "Travis",
      lastName: "Holt",
      email: "dispatcher@acelegacyservices.com",
      role: "DISPATCHER",
      title: "Lead Fleet Dispatcher",
      departmentId: deptDispatch.id,
      branchId: branchDallas.id,
      hourlyRate: 30.0,
      baseSalary: 62000.0,
    },
    {
      employeeId: "EMP-1007",
      firstName: "Sophia",
      lastName: "Chen",
      email: "accounting.manager@acelegacyservices.com",
      role: "ACCOUNTING_MANAGER",
      title: "Finance & Accounting Controller",
      departmentId: deptFinance.id,
      branchId: branchDallas.id,
      hourlyRate: 48.0,
      baseSalary: 100000.0,
    },
    {
      employeeId: "EMP-1008",
      firstName: "Lucas",
      lastName: "Wright",
      email: "accountant@acelegacyservices.com",
      role: "ACCOUNTANT",
      title: "Freight Billing & Payables Specialist",
      departmentId: deptFinance.id,
      branchId: branchDallas.id,
      hourlyRate: 26.0,
      baseSalary: 52000.0,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersData) {
    const createdUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        companyId: company.id,
        branchId: u.branchId,
        departmentId: u.departmentId,
        shiftId: dayShift.id,
        employeeId: u.employeeId,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash: defaultPassword,
        role: u.role,
        title: u.title,
        status: "ACTIVE",
        hourlyRate: u.hourlyRate,
        baseSalary: u.baseSalary,
        hireDate: new Date("2024-01-15"),
      },
    });
    seededUsers[u.role] = createdUser;
  }

  // 5. Attendance & Shifts Demo
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendance.create({
    data: {
      userId: seededUsers["SALES_AGENT"].id,
      date: today,
      clockIn: new Date(Date.now() - 6 * 3600 * 1000), // 6 hours ago
      breakMinutes: 45,
      totalHours: 5.25,
      status: "PRESENT",
      notes: "On-time arrival, logged in from Dallas office",
      ipAddress: "192.168.1.104",
    },
  });

  await prisma.attendance.create({
    data: {
      userId: seededUsers["DISPATCHER"].id,
      date: today,
      clockIn: new Date(Date.now() - 7 * 3600 * 1000),
      breakMinutes: 30,
      totalHours: 6.5,
      status: "PRESENT",
      notes: "Early morning load board coverage",
      ipAddress: "192.168.1.112",
    },
  });

  // 6. Customers (Shippers)
  const customerApex = await prisma.customer.create({
    data: {
      name: "Apex Food Distributors LLC",
      dba: "Apex Foods",
      type: "SHIPPER",
      address: "880 Industrial Way",
      city: "Fort Worth",
      state: "TX",
      zip: "76102",
      phone: "+1 (817) 555-8901",
      email: "logistics@apexfoods.com",
      billingEmail: "ap@apexfoods.com",
      creditLimit: 50000.0,
      paymentTerms: "NET_30",
      status: "ACTIVE",
      notes: "High volume refrigerated and ambient dry freight shipper. Requires strict appointment times.",
      contacts: {
        create: [
          {
            firstName: "Richard",
            lastName: "Gomez",
            title: "Director of Transportation",
            email: "rgomez@apexfoods.com",
            phone: "+1 (817) 555-8902",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const customerSummit = await prisma.customer.create({
    data: {
      name: "Summit Steel & Fabrication Co.",
      dba: "Summit Steel",
      type: "MANUFACTURER",
      address: "4100 Foundry Road",
      city: "Gary",
      state: "IN",
      zip: "46402",
      phone: "+1 (219) 555-3312",
      email: "shipping@summitsteel.com",
      billingEmail: "accounting@summitsteel.com",
      creditLimit: 75000.0,
      paymentTerms: "NET_30",
      status: "ACTIVE",
      notes: "Heavy flatbed and step deck machinery shipper.",
      contacts: {
        create: [
          {
            firstName: "Mark",
            lastName: "Kovacs",
            title: "Shipping Manager",
            email: "mkovacs@summitsteel.com",
            phone: "+1 (219) 555-3315",
            isPrimary: true,
          },
        ],
      },
    },
  });

  // 7. Leads & Multi-Version Quotes
  const lead1 = await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-001",
      customerId: customerApex.id,
      companyName: "Apex Food Distributors LLC",
      contactName: "Richard Gomez",
      email: "rgomez@apexfoods.com",
      phone: "+1 (817) 555-8902",
      source: "INBOUND",
      status: "WON",
      salesAgentId: seededUsers["SALES_AGENT"].id,
      estimatedValue: 12000.0,
      notes: "Regular 3 loads per week corridor from Dallas to Atlanta.",
    },
  });

  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-00101",
      leadId: lead1.id,
      customerId: customerApex.id,
      createdById: seededUsers["SALES_AGENT"].id,
      currentVersion: 2,
      status: "CUSTOMER_ACCEPTED",
      internalApprovalStatus: "APPROVED",
      approvedBy: seededUsers["SALES_MANAGER"].firstName + " " + seededUsers["SALES_MANAGER"].lastName,
      approvalNotes: "16.8% margin complies with company guidelines (>12%). Approved.",
      originCity: "Dallas",
      originState: "TX",
      destCity: "Atlanta",
      destState: "GA",
      equipment: "DRY_VAN",
      totalMiles: 785.0,
      versions: {
        create: [
          {
            versionNumber: 1,
            customerRate: 3600.0,
            carrierEstimatedCost: 2900.0,
            estimatedMargin: 700.0,
            marginPercentage: 19.4,
            fuelSurchargeIncluded: true,
            validUntil: new Date("2026-11-20"),
            customerDecision: "COUNTER_OFFER",
            counterOfferAmount: 3350.0,
            notes: "Initial quote submitted. Customer countered at $3,350.",
          },
          {
            versionNumber: 2,
            customerRate: 3450.0,
            carrierEstimatedCost: 2850.0,
            estimatedMargin: 600.0,
            marginPercentage: 17.39,
            fuelSurchargeIncluded: true,
            validUntil: new Date("2026-11-25"),
            customerDecision: "ACCEPTED",
            decisionDate: new Date(),
            acceptanceProofUrl: "/uploads/proofs/apex_signed_qt_00101.pdf",
            notes: "Customer accepted revised rate of $3,450. Converted to Brokerage Load.",
          },
        ],
      },
    },
  });

  // 8. Carriers & Compliance
  const carrierEagle = await prisma.carrier.create({
    data: {
      legalName: "Eagle Express Freight Inc",
      dba: "Eagle Express",
      mcNumber: "MC-982341",
      dotNumber: "USDOT-3109281",
      taxId: "47-1928374",
      address: "500 Logistics Way, Suite 10",
      city: "Memphis",
      state: "TN",
      zip: "38118",
      phone: "+1 (901) 555-4422",
      dispatchEmail: "dispatch@eagleexpressfreight.com",
      accountingEmail: "ap@eagleexpressfreight.com",
      paymentTerms: "NET_30",
      status: "ACTIVE",
      safetyScore: "SATISFACTORY",
      insuranceCargoAmount: 100000.0,
      insuranceCargoExpiry: new Date("2027-05-15"),
      insuranceAutoAmount: 1000000.0,
      insuranceAutoExpiry: new Date("2027-05-15"),
      w9OnFile: true,
      coiOnFile: true,
      agreementOnFile: true,
      verifiedAt: new Date("2026-02-10"),
      verifiedBy: "Operations Manager Caleb Brooks",
      contacts: {
        create: [
          {
            name: "Hank Patterson",
            title: "Lead Dispatcher",
            phone: "+1 (901) 555-4423",
            email: "hank@eagleexpressfreight.com",
            isPrimary: true,
          },
        ],
      },
    },
  });

  // 9. Brokerage Load & Multi-Stop Schedule
  const load1 = await prisma.brokerageLoad.create({
    data: {
      loadNumber: "BL-2026-00401",
      quoteId: quote1.id,
      customerId: customerApex.id,
      assignedOpsId: seededUsers["OPERATIONS_MANAGER"].id,
      customerRefNo: "PO-APEX-88219",
      equipment: "DRY_VAN",
      commodity: "Packaged Dry Grocery Goods",
      weightLbs: 42500.0,
      palletCount: 26,
      totalMiles: 785.0,
      customerRate: 3450.0,
      carrierRate: 2850.0,
      accessorialCustomer: 0.0,
      accessorialCarrier: 0.0,
      grossMargin: 600.0,
      marginPercent: 17.39,
      coverageStatus: "COVERED",
      executionStatus: "IN_TRANSIT",
      financialStatus: "UNBILLED",
      carrierId: carrierEagle.id,
      driverName: "Darius Jackson",
      driverPhone: "+1 (901) 555-9011",
      truckNumber: "Unit-402",
      trailerNumber: "VN-5381",
      rateConSignedUrl: "/uploads/rate_cons/RC-BL-2026-00401.pdf",
      stops: {
        create: [
          {
            stopSequence: 1,
            stopType: "PICKUP",
            facilityName: "Apex Dallas Distribution Center",
            address: "3200 Mountain Creek Pkwy",
            city: "Dallas",
            state: "TX",
            zip: "75236",
            contactName: "Warehouse Supervisor Greg",
            contactPhone: "+1 (214) 555-7788",
            apptWindowStart: new Date("2026-11-04T08:00:00Z"),
            apptWindowEnd: new Date("2026-11-04T12:00:00Z"),
            timezone: "America/Chicago",
            actualArrival: new Date("2026-11-04T08:45:00Z"),
            actualDeparture: new Date("2026-11-04T10:30:00Z"),
            status: "COMPLETED",
            notes: "Loaded 26 pallets clean. Seals verified #589211.",
          },
          {
            stopSequence: 2,
            stopType: "DELIVERY",
            facilityName: "Southeastern Supermarket Hub",
            address: "1850 Logistics Way",
            city: "Forest Park",
            state: "GA",
            zip: "30297",
            contactName: "Receiving Office",
            contactPhone: "+1 (404) 555-1290",
            apptWindowStart: new Date("2026-11-05T09:00:00Z"),
            apptWindowEnd: new Date("2026-11-05T13:00:00Z"),
            timezone: "America/New_York",
            status: "PENDING",
            notes: "Strict delivery appointment at 09:00 AM.",
          },
        ],
      },
      events: {
        create: [
          {
            eventType: "STATUS_CHANGE",
            location: "Dallas, TX",
            message: "Driver Darius departed shipper loaded with seal #589211. En route via I-20 E.",
            actorName: "Travis Holt",
          },
          {
            eventType: "CHECK_CALL",
            location: "Meridian, MS",
            message: "Midpoint check call. Driver running on schedule. ETA Forest Park, GA 08:30 AM.",
            actorName: "Travis Holt",
          },
        ],
      },
    },
  });

  // Link quote back to converted load
  await prisma.quote.update({
    where: { id: quote1.id },
    data: { convertedLoadId: load1.id, status: "CONVERTED" },
  });

  // 10. Dispatch Division Setup (Fleet & Dispatched Loads)
  const dispatchClient = await prisma.dispatchClient.create({
    data: {
      clientCode: "DC-101",
      companyName: "Redline Freightways LLC",
      ownerName: "Victor Morales",
      mcNumber: "MC-719283",
      dotNumber: "USDOT-2819382",
      phone: "+1 (512) 555-6677",
      email: "victor@redlinefreight.com",
      address: "1400 Commerce Park, Austin, TX 78728",
      feeType: "PERCENTAGE",
      feeValue: 8.0, // 8% of gross load freight
      contractStart: new Date("2025-06-01"),
      status: "ACTIVE",
      notes: "Contracted for dedicated dispatch services at 8.0% fee. 2 units operating regional South & Midwest.",
    },
  });

  const truck1 = await prisma.truck.create({
    data: {
      clientId: dispatchClient.id,
      unitNumber: "TRK-101",
      vin: "1FUJGHD786LN91823",
      trailerType: "DRY_VAN",
      trailerNumber: "TL-5310",
      maxWeightLbs: 45000.0,
      homeBaseCity: "Austin",
      homeBaseState: "TX",
      status: "UNDER_LOAD",
      currentLocation: "Little Rock, AR",
      minRatePerMile: 2.30,
      maxDeadheadMiles: 80.0,
      preferredLanes: "Texas to Midwest, Southeast",
    },
  });

  const driver1 = await prisma.driver.create({
    data: {
      truckId: truck1.id,
      firstName: "Hector",
      lastName: "Ramos",
      phone: "+1 (512) 555-8812",
      email: "hramos@redlinefreight.com",
      cdlNumber: "TX-CDL-8821902",
      cdlState: "TX",
      status: "ACTIVE",
    },
  });

  const dispatchLoad1 = await prisma.dispatchLoad.create({
    data: {
      dispatchNumber: "DL-2026-00201",
      clientId: dispatchClient.id,
      truckId: truck1.id,
      driverId: driver1.id,
      dispatcherId: seededUsers["DISPATCHER"].id,
      brokerName: "Echo Global Logistics",
      brokerContact: "Sarah Jenkins",
      brokerPhone: "+1 (312) 555-7000",
      brokerRefNumber: "ECHO-891230",
      originCity: "Dallas",
      originState: "TX",
      destCity: "St. Louis",
      destState: "MO",
      loadedMiles: 630.0,
      deadheadMiles: 25.0,
      grossFreightRate: 2100.0,
      ratePerMile: 3.33,
      feeType: "PERCENTAGE",
      feeRate: 8.0,
      calculatedFee: 168.0, // 2100 * 0.08 = $168.00 Ace Legacy Services Service Revenue
      pickupDate: new Date("2026-11-04T14:00:00Z"),
      deliveryDate: new Date("2026-11-05T11:00:00Z"),
      status: "IN_TRANSIT",
      feeBilled: false,
      notes: "Sourced from DAT board. Surcharges all inclusive. Clean paper.",
      checkCalls: {
        create: [
          {
            location: "Texarkana, AR",
            statusUpdate: "Loaded and departed Dallas. Rolling on I-30 E.",
            milesToDest: 375.0,
          },
        ],
      },
    },
  });

  // 11. Accounting: Shipper Invoices (AR) & Carrier Payables (AP)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-00101",
      division: "BROKERAGE",
      customerId: customerApex.id,
      brokerageLoadId: load1.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      paymentTerms: "NET_30",
      subtotal: 3450.0,
      accessorialTotal: 0.0,
      totalAmount: 3450.0,
      amountPaid: 0.0,
      balanceDue: 3450.0,
      status: "SENT",
      notes: "Invoice for Brokerage Load BL-2026-00401 Dallas to Atlanta.",
      lines: {
        create: [
          {
            description: "Linehaul Freight Services (Dallas, TX to Atlanta, GA)",
            quantity: 1,
            unitPrice: 3450.0,
            total: 3450.0,
          },
        ],
      },
    },
  });

  const dispatchStmt1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "STMT-2026-0005",
      division: "DISPATCH",
      dispatchClientId: dispatchClient.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      paymentTerms: "NET_7",
      subtotal: 368.0,
      accessorialTotal: 0.0,
      totalAmount: 368.0,
      amountPaid: 0.0,
      balanceDue: 368.0,
      status: "SENT",
      notes: "Weekly dispatch service statement (Loads DL-2026-00198 and DL-2026-00201).",
      lines: {
        create: [
          {
            description: "Dispatch Fee: Load DL-2026-00198 ($2,500 Gross @ 8%)",
            quantity: 1,
            unitPrice: 200.0,
            total: 200.0,
          },
          {
            description: "Dispatch Fee: Load DL-2026-00201 ($2,100 Gross @ 8%)",
            quantity: 1,
            unitPrice: 168.0,
            total: 168.0,
          },
        ],
      },
    },
  });

  const payable1 = await prisma.carrierPayable.create({
    data: {
      payableNumber: "AP-2026-00401",
      loadId: load1.id,
      carrierId: carrierEagle.id,
      carrierInvoiceNo: "EAGLE-INV-88912",
      amountAgreed: 2850.0,
      accessorialApproved: 0.0,
      totalDue: 2850.0,
      amountPaid: 0.0,
      balanceDue: 2850.0,
      status: "APPROVED_FOR_PAYMENT",
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  // 12. Commission Plans & Earned Commissions
  const planSales = await prisma.commissionPlan.create({
    data: {
      name: "Freight Sales Incentive Plan (10% Gross Margin)",
      role: "SALES_AGENT",
      division: "BROKERAGE",
      percentage: 10.0,
      triggerEvent: "ON_INVOICE_SENT",
    },
  });

  const planDispatch = await prisma.commissionPlan.create({
    data: {
      name: "Fleet Dispatcher Plan (5% Service Fee)",
      role: "DISPATCHER",
      division: "DISPATCH",
      percentage: 5.0,
      triggerEvent: "ON_LOAD_DELIVERED",
    },
  });

  await prisma.commission.create({
    data: {
      userId: seededUsers["SALES_AGENT"].id,
      planId: planSales.id,
      division: "BROKERAGE",
      brokerageLoadId: load1.id,
      baseAmount: 600.0, // Gross Margin
      commissionRate: 10.0,
      earnedAmount: 60.0, // $600 * 10%
      status: "APPROVED",
      approvedAt: new Date(),
      notes: "Earned on Brokerage Load BL-2026-00401 gross margin ($600.00).",
    },
  });

  await prisma.commission.create({
    data: {
      userId: seededUsers["DISPATCHER"].id,
      planId: planDispatch.id,
      division: "DISPATCH",
      dispatchLoadId: dispatchLoad1.id,
      baseAmount: 168.0, // Dispatch Fee
      commissionRate: 5.0,
      earnedAmount: 8.40, // $168 * 5%
      status: "PENDING",
      notes: "Dispatch commission calculated on service fee ($168.00).",
    },
  });

  // 13. Audit Log Initial Records
  await prisma.auditLog.createMany({
    data: [
      {
        userId: seededUsers["SUPER_ADMIN"].id,
        actorName: "Marcus Sterling (Admin)",
        action: "INITIAL_SEED",
        entity: "System",
        entityId: "system-init",
        newValue: JSON.stringify({ message: "Initial database seed and RBAC permissions established" }),
      },
      {
        userId: seededUsers["SALES_AGENT"].id,
        actorName: "Jordan Miller (Sales)",
        action: "STATUS_CHANGE",
        entity: "Quote",
        entityId: quote1.id,
        newValue: JSON.stringify({ status: "CUSTOMER_ACCEPTED", version: 2, amount: 3450.0 }),
      },
    ],
  });

  console.log("✅ Seed completed successfully! Ace Legacy Services database is ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
