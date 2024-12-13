"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

enum OrderStatus {
  New = "New",
  Preparing = "Preparing",
  ReadyToDeliver = "Ready to Deliver",
  Delivered = "Delivered",
}


interface OrderItem {
  id: number;
  orderNumber: number;
  tableNumber: number;
  itemName: string;
  status: OrderStatus;
  area: string;
}

export default function BackOfHousePage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.New:
        return "bg-gradient-to-b from-red-100 from-0% to-white to-60%";
      case OrderStatus.Preparing:
        return "bg-gradient-to-b from-orange-100 from-0% to-white to-30%";
      case OrderStatus.ReadyToDeliver:
        return "bg-gradient-to-b from-amber-100 from-0% to-white to-60%";
      case OrderStatus.Delivered:
        return "bg-gradient-to-b from-lime-100 from-0% to-white to-60%";
      default:
        return "bg-gray-200"; // Use a neutral color for unknown statuses
    }
  };

  const translateStatus = (status: string): OrderStatus => {
    switch (status) {
      case 'New':
        return OrderStatus.New;
      case 'Preparing':
        return OrderStatus.Preparing;
      case 'ReadyToDeliver':
        return OrderStatus.ReadyToDeliver;
      case 'Delivered':
        return OrderStatus.Delivered;
      default:
        return OrderStatus.New; // Default to 'New' if status is unknown
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/data?type=getOrders');
        const data = await response.json();
        const translatedOrders = data.map((order: any) => ({
          ...order,
          status: translateStatus(order.status),
        }));
        setOrders(translatedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => 
    order.status !== OrderStatus.Delivered && 
    (selectedArea === "all" || order.area.toLowerCase() === selectedArea)
  );

  const translateStatusToInt = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.New:
        return 0;
      case OrderStatus.Preparing:
        return 1;
      case OrderStatus.ReadyToDeliver:
        return 2;
      case OrderStatus.Delivered:
        return 3;
      default:
        return -1; // Unknown status
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const response = await fetch('/api/data?type=updateOrderStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, newStatus: translateStatusToInt(newStatus) }),
      });

      if (response.ok) {
        const updatedOrders = orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        );
        setOrders(updatedOrders);
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Back of House</h1>
        <div className="flex items-center space-x-4">
          <Select 
            defaultValue="all"
            onValueChange={(value) => setSelectedArea(value)}
          >
            <SelectTrigger className="bg-slate-50 border-gray-200">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((item) => (
          <Card key={item.id} className={`shadow-lg ${getStatusColor(item.status)}`}>
              <CardHeader className={`text-black rounded-t-lg`}>
                  <div className="text-3xl font-black">
                    <h2>{`Order #${item.orderNumber}`}</h2>
                  </div>
                  <CardDescription className="font-bold text-black text-xl ">{item.status}</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-l font-semibold">Table: {item.tableNumber}</p>
                  <p className="text-l font-semibold">Item: {item.itemName}</p>
              </CardContent>
              <CardFooter>
                  <Button
                      onClick={() => updateOrderStatus(item.id, OrderStatus.Preparing)}
                      className="w-full mr-5 bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                      Preparing
                  </Button>
                  <Button
                      onClick={() => updateOrderStatus(item.id, OrderStatus.ReadyToDeliver)}
                      className="w-full mr-0 bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                      Ready!
                  </Button>
              </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}