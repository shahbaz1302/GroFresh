import { auth } from "@/auth";
import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { message: "Unauthorized. Admin access required." },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    // Ensure models are registered for populate
    const _u = userModel;
    const _g = groceryModel;

    // Fetch all orders
    const orders = await orderModel
      .find()
      .populate("userId", "name email mobile image role")
      .populate("assignedDeliveryBoy", "name email mobile image role isOnline")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch delivery partners & customers
    const deliveryBoys = await userModel
      .find({ role: "deliveryBoy" })
      .select("name email mobile image isOnline location updatedAt")
      .lean();

    const totalCustomers = await userModel.countDocuments({ role: "user" });
    const totalGroceries = await groceryModel.countDocuments();
    const categoriesList = await groceryModel.distinct("category");

    // Overall Revenue Calculations
    let totalRevenue = 0;
    let paidRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    let deliveredRevenue = 0;

    let pendingCount = 0;
    let outForDeliveryCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRevenue = 0;
    let todayOrdersCount = 0;
    let todayDeliveredCount = 0;

    let weekRevenue = 0;
    let weekOrdersCount = 0;

    let monthRevenue = 0;
    let monthOrdersCount = 0;

    // Track top selling groceries: groceryId/name -> { name, image, unit, quantity, revenue }
    const itemSalesMap: Record<
      string,
      { name: string; image: string; unit: string; quantity: number; revenue: number }
    > = {};

    // Grouping by date for 7-day trend: "YYYY-MM-DD"
    const last7DaysMap: Record<
      string,
      { date: string; label: string; revenue: number; orders: number; delivered: number }
    > = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      last7DaysMap[isoKey] = {
        date: isoKey,
        label,
        revenue: 0,
        orders: 0,
        delivered: 0,
      };
    }

    // Hourly map for today (0 to 23)
    const todayHourlyMap: { hour: number; label: string; revenue: number; orders: number }[] =
      Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: `${h.toString().padStart(2, "0")}:00`,
        revenue: 0,
        orders: 0,
      }));

    for (const order of orders) {
      const amount = Number(order.totalAmount) || 0;
      const orderDate = new Date(order.createdAt || Date.now());
      const isCancelled = order.status === "cancelled";

      // Status tally
      if (order.status === "pending") pendingCount++;
      else if (order.status === "outForDelivery") outForDeliveryCount++;
      else if (order.status === "delivered") deliveredCount++;
      else if (order.status === "cancelled") cancelledCount++;

      // Revenue tally (exclude cancelled)
      if (!isCancelled) {
        totalRevenue += amount;
        if (order.isPaid) paidRevenue += amount;
        if (order.paymentMethod === "online") onlineRevenue += amount;
        else cashRevenue += amount;

        if (order.status === "delivered") deliveredRevenue += amount;

        // Today
        if (orderDate >= startOfToday) {
          todayRevenue += amount;
          todayOrdersCount++;
          if (order.status === "delivered") todayDeliveredCount++;
          const h = orderDate.getHours();
          if (todayHourlyMap[h]) {
            todayHourlyMap[h].revenue += amount;
            todayHourlyMap[h].orders += 1;
          }
        }

        // Week
        if (orderDate >= startOfWeek) {
          weekRevenue += amount;
          weekOrdersCount++;
        }

        // Month
        if (orderDate >= startOfMonth) {
          monthRevenue += amount;
          monthOrdersCount++;
        }

        // 7-day trend
        const isoDate = orderDate.toISOString().split("T")[0];
        if (last7DaysMap[isoDate]) {
          last7DaysMap[isoDate].revenue += amount;
          last7DaysMap[isoDate].orders += 1;
          if (order.status === "delivered") {
            last7DaysMap[isoDate].delivered += 1;
          }
        }

        // Top items aggregation
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const key = item.name;
            if (!itemSalesMap[key]) {
              itemSalesMap[key] = {
                name: item.name,
                image: item.image,
                unit: item.unit,
                quantity: 0,
                revenue: 0,
              };
            }
            const q = Number(item.quantity) || 1;
            const p = Number(item.price) || 0;
            itemSalesMap[key].quantity += q;
            itemSalesMap[key].revenue += p * q;
          }
        }
      }
    }

    const topSellingItems = Object.values(itemSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const nonCancelledOrdersCount = orders.length - cancelledCount;
    const averageOrderValue =
      nonCancelledOrdersCount > 0 ? Math.round(totalRevenue / nonCancelledOrdersCount) : 0;

    const onlineDeliveryBoys = deliveryBoys.filter((d) => d.isOnline).length;

    return NextResponse.json(
      {
        summary: {
          totalRevenue,
          paidRevenue,
          cashRevenue,
          onlineRevenue,
          deliveredRevenue,
          totalOrders: orders.length,
          nonCancelledOrdersCount,
          averageOrderValue,
          statusCounts: {
            pending: pendingCount,
            outForDelivery: outForDeliveryCount,
            delivered: deliveredCount,
            cancelled: cancelledCount,
          },
          today: {
            revenue: todayRevenue,
            orders: todayOrdersCount,
            delivered: todayDeliveredCount,
          },
          week: {
            revenue: weekRevenue,
            orders: weekOrdersCount,
          },
          month: {
            revenue: monthRevenue,
            orders: monthOrdersCount,
          },
          fleet: {
            totalDeliveryBoys: deliveryBoys.length,
            onlineDeliveryBoys,
          },
          catalog: {
            totalGroceries,
            totalCategories: categoriesList.length,
          },
          totalCustomers,
        },
        dailyTrend: Object.values(last7DaysMap),
        todayHourly: todayHourlyMap,
        topSellingItems,
        deliveryBoysList: deliveryBoys.map((d) => ({
          _id: d._id.toString(),
          name: d.name,
          mobile: d.mobile,
          email: d.email,
          image: d.image,
          isOnline: Boolean(d.isOnline),
        })),
        recentOrders: orders.slice(0, 15).map((o) => ({
          _id: o._id.toString(),
          totalAmount: o.totalAmount,
          status: o.status,
          paymentMethod: o.paymentMethod,
          isPaid: o.isPaid,
          createdAt: o.createdAt,
          itemsCount: o.items?.length || 0,
          customerName:
            (o.userId as any)?.name || o.deliveryAddress?.fullName || "Guest Customer",
          customerPhone: (o.userId as any)?.mobile || o.deliveryAddress?.phone || "",
          deliveryBoyName: (o.assignedDeliveryBoy as any)?.name || null,
          deliveryCity: o.deliveryAddress?.city || "",
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
