import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Table from "@/models/table";
import Restaurant from "@/models/restaurant";
import MenuItem from "@/models/menu-item";
import Order from "@/models/order";

interface RouteContext {
  params: Promise<{
    qrToken: string;
  }>;
}

interface OrderRequestItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { qrToken } = await context.params;

    if (!qrToken || typeof qrToken !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "QR token is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const rawItems = body?.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    if (rawItems.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many different items in one order.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ------------------------------------------------------------
    // 1. Find table from QR token
    // ------------------------------------------------------------

    const table = await Table.findOne({
      qrToken,
    });

    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired QR code.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 2. Verify restaurant
    // ------------------------------------------------------------

    const restaurant = await Restaurant.findOne({
      _id: table.restaurantId,
      status: "ACTIVE",
    }).select("_id name");

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "This restaurant is currently unavailable.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 3. Check table status
    // ------------------------------------------------------------

    if (
      table.status !== "AVAILABLE" &&
      table.status !== "OCCUPIED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This table is currently unavailable for new orders.",
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------
    // 4. Validate and normalize cart items
    // ------------------------------------------------------------

    const requestedItems: OrderRequestItem[] = [];

    for (const item of rawItems) {
      if (
        !item ||
        typeof item.menuItemId !== "string" ||
        !item.menuItemId.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid menu item in your cart.",
          },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Each item quantity must be between 1 and 99.",
          },
          { status: 400 }
        );
      }

      let itemNotes: string | undefined;

      if (item.notes !== undefined) {
        if (typeof item.notes !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid item notes.",
            },
            { status: 400 }
          );
        }

        const normalizedItemNotes = item.notes.trim();

        if (normalizedItemNotes.length > 500) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Item notes cannot exceed 500 characters.",
            },
            { status: 400 }
          );
        }

        itemNotes =
          normalizedItemNotes || undefined;
      }

      requestedItems.push({
        menuItemId: item.menuItemId.trim(),
        quantity,
        notes: itemNotes,
      });
    }

    // ------------------------------------------------------------
    // 5. Prevent duplicate menu item IDs
    // ------------------------------------------------------------

    const uniqueItemIds = new Set(
      requestedItems.map(
        (item) => item.menuItemId
      )
    );

    if (
      uniqueItemIds.size !==
      requestedItems.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The same menu item cannot appear multiple times in the cart.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 6. Fetch real menu items from database
    // ------------------------------------------------------------

    const menuItemIds = requestedItems.map(
      (item) => item.menuItemId
    );

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: restaurant._id,
      isAvailable: true,
    }).lean();

    // ------------------------------------------------------------
    // 7. Make sure every requested item exists
    // ------------------------------------------------------------

    if (
      menuItems.length !==
      requestedItems.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more items are unavailable or no longer exist. Please refresh your menu.",
        },
        { status: 409 }
      );
    }

    const menuItemMap = new Map(
      menuItems.map((item) => [
        item._id.toString(),
        item,
      ])
    );

    // ------------------------------------------------------------
    // 8. Build order items using database prices
    // ------------------------------------------------------------

    const orderItems = requestedItems.map(
      (requestedItem) => {
        const menuItem = menuItemMap.get(
          requestedItem.menuItemId
        );

        if (!menuItem) {
          throw new Error(
            `Menu item ${requestedItem.menuItemId} was not found.`
          );
        }

        const itemTotal =
          menuItem.price *
          requestedItem.quantity;

        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: requestedItem.quantity,
          price: menuItem.price,
          total: itemTotal,
          notes: requestedItem.notes,
        };
      }
    );

    // ------------------------------------------------------------
    // 9. Calculate totals on server
    // ------------------------------------------------------------

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const tax = 0;
    const discount = 0;

    const total =
      subtotal + tax - discount;

    if (total <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order total must be greater than zero.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 10. Generate restaurant-specific order number
    // ------------------------------------------------------------

    const latestOrder = await Order.findOne({
      restaurantId: restaurant._id,
    })
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean();

    const orderNumber = latestOrder
      ? latestOrder.orderNumber + 1
      : 1;

    // ------------------------------------------------------------
    // 11. Customer information
    // ------------------------------------------------------------

    let customerName: string | undefined;
    let customerPhone: string | undefined;
    let orderNotes: string | undefined;

    // ------------------------------------------------------------
    // Customer name
    // ------------------------------------------------------------

    if (
      body.customerName !== undefined
    ) {
      if (
        typeof body.customerName !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid customer name.",
          },
          { status: 400 }
        );
      }

      const normalizedCustomerName =
        body.customerName.trim();

      if (
        normalizedCustomerName.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer name cannot exceed 100 characters.",
          },
          { status: 400 }
        );
      }

      customerName =
        normalizedCustomerName || undefined;
    }

    // ------------------------------------------------------------
    // Customer phone
    // ------------------------------------------------------------

    if (
      body.customerPhone !== undefined
    ) {
      if (
        typeof body.customerPhone !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid customer phone number.",
          },
          { status: 400 }
        );
      }

      const normalizedCustomerPhone =
        body.customerPhone.trim();

      if (
        normalizedCustomerPhone.length > 30
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer phone number is too long.",
          },
          { status: 400 }
        );
      }

      customerPhone =
        normalizedCustomerPhone || undefined;
    }

    // ------------------------------------------------------------
    // Order notes
    // ------------------------------------------------------------

    if (body.notes !== undefined) {
      if (
        typeof body.notes !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid order notes.",
          },
          { status: 400 }
        );
      }

      const normalizedOrderNotes =
        body.notes.trim();

      if (
        normalizedOrderNotes.length > 1000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Order notes cannot exceed 1000 characters.",
          },
          { status: 400 }
        );
      }

      orderNotes =
        normalizedOrderNotes || undefined;
    }

    // ------------------------------------------------------------
    // 12. Create order
    // ------------------------------------------------------------

    const order = await Order.create({
      restaurantId: restaurant._id,
      tableId: table._id,

      orderNumber,

      orderType: "DINE_IN",
      source: "CUSTOMER_QR",

      items: orderItems,

      subtotal,
      tax,
      discount,
      total,

      status: "PLACED",

      paymentStatus: "PENDING",

      customerName,
      customerPhone,
      notes: orderNotes,
    });

    // ------------------------------------------------------------
    // 13. Mark table occupied
    // ------------------------------------------------------------

    if (table.status === "AVAILABLE") {
      await Table.updateOne(
        {
          _id: table._id,
          restaurantId: restaurant._id,
          status: "AVAILABLE",
        },
        {
          $set: {
            status: "OCCUPIED",
          },
        }
      );
    }

    // ------------------------------------------------------------
    // 14. Return order
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",

        order: {
          id: order._id.toString(),

          orderNumber:
            order.orderNumber,

          restaurantId:
            order.restaurantId.toString(),

          tableId:
            order.tableId?.toString(),

          items: order.items,

          subtotal: order.subtotal,
          tax: order.tax,
          discount: order.discount,
          total: order.total,

          status: order.status,

          paymentStatus:
            order.paymentStatus,

          createdAt:
            order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Customer order creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to place your order.",
      },
      { status: 500 }
    );
  }
}