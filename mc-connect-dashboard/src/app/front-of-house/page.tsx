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
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

enum OrderStatus {
  New = "New",
  Preparing = "Preparing",
  ReadyToDeliver = "Ready to Deliver",
  Delivered = "Delivered",
  Paid = "Paid",
  Closed = "Closed",
}

enum TableStatus {
  Available = "Available",
  Dining = "Dining",
  HelpRequested = "Help Requested",
  ManagerRequested = "Manager Requested",
}

enum Area {
  Bar = "Bar",
  Kitchen = "Kitchen",
}

interface OrderItem {
  id: number;
  orderNumber: number;
  tableNumber: number; // TODO: link table number to this
  //items: FoodItem[];
  orderStatus: OrderStatus;
  orderBalance: number;
  area: Area;
}

interface Table {
  id: number;
  tableNumber: number;
  status: TableStatus;
  orders: OrderItem[];
}

export default function BackOfHousePage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("bar");
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isFilterMode, setIsFilterMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchTablesAndOrders = async () => {
      try {
        const tableResponse = await fetch('/api/data?type=getDevices');
        if (!tableResponse.ok) {
          if (tableResponse.status === 400) {
            console.error('Bad request: Invalid parameters for getDevices');
          } else {
            console.error('Error fetching tables:', tableResponse.statusText);
          }
          return;
        }
        const tableData = await tableResponse.json();
        const tables = tableData.map((item: any) => ({
          id: item.TableID,
          tableNumber: item.TableID,
          status: item.Help[0] === 1 ? TableStatus.HelpRequested : TableStatus.Available,
          orders: [],
        }));

        const orderResponse = await fetch('/api/data?type=getOrders');
        if (!orderResponse.ok) {
          if (orderResponse.status === 400) {
            console.error('Bad request: Invalid parameters for getOrders');
          } else {
            console.error('Error fetching orders:', orderResponse.statusText);
          }
          return;
        }
        const orderData = await orderResponse.json();
        const orders = orderData.map((item: any) => ({
          id: item.id,
          orderNumber: item.id,
          tableNumber: item.tableNumber,
          orderStatus: item.status === 'New' ? OrderStatus.New :
                        item.status === 'Preparing' ? OrderStatus.Preparing :
                        item.status === 'ReadyToDeliver' ? OrderStatus.ReadyToDeliver :
                        OrderStatus.Delivered,
          orderBalance: parseFloat(item.price).toFixed(2), // Ensure orderBalance is a float with two decimal places
          area: item.area ? (item.area.toLowerCase() === 'bar' ? Area.Bar : Area.Kitchen) : 'Unknown',
        }));

        // Append orders to tables if the table ID matches and update table status
        const tablesWithOrders = tables.map(table => {
          const tableOrders = orders.filter(order => order.tableNumber === table.tableNumber);
          return {
            ...table,
            orders: tableOrders,
            status: tableOrders.length > 0 ? TableStatus.Dining : table.status,
          };
        });

        setTables(tablesWithOrders);
        setOrders(orders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchTablesAndOrders();
    const interval = setInterval(fetchTablesAndOrders, 5000); // Update every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const toggleTableSelection = (tableNumber: number) => {
    setSelectedTables(prevSelectedTables =>
      prevSelectedTables.includes(tableNumber)
        ? prevSelectedTables.filter(num => num !== tableNumber)
        : [...prevSelectedTables, tableNumber]
    );
  };

  const confirmTableSelection = () => {
    setIsFilterMode(false);
  };

  const clearTableSelection = () => {
    setSelectedTables([]);
  };

  const filteredTables = isFilterMode
    ? tables
    : selectedTables.length > 0
      ? tables.filter(table => selectedTables.includes(table.tableNumber))
      : tables;

  const filteredOrders = orders.filter((order) => 
    order.area.toLowerCase() === selectedArea
  );

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.New:
        return "bg-gradient-to-r from-red-100 from-0% to-white to-30%";
      case OrderStatus.Preparing:
        return "bg-gradient-to-r from-orange-100 from-0% to-white to-30%";
      case OrderStatus.ReadyToDeliver:
        return "bg-gradient-to-r from-amber-100 from-0% to-white to-30%";
      case OrderStatus.Delivered:
        return "bg-gradient-to-r from-lime-100 from-0% to-white to-30%";
      case OrderStatus.Paid:
        return "bg-gradient-to-r from-green-100 from-0% to-white to-30%";
      case OrderStatus.Closed:
        return "bg-gradient-to-r from-gray-100 from-0% to-white to-30%";
      default:
        return "bg-[#0C8CE9]";
    }
  };

  const getTableStatusColor = (status: TableStatus): string => {
    switch (status) {
      case TableStatus.Available:
        return "white";
      case TableStatus.Dining:
        return "bg-gradient-to-b from-blue-100 from-0% to-white to-30%";
      case TableStatus.HelpRequested:
        return "bg-gradient-to-b from-red-100 from-0% to-white to-30%";
      case TableStatus.ManagerRequested:
        return "bg-gradient-to-b from-red-100 from-0% to-white to-30%";
      default:
        return "bg-gray-200";
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, orderStatus: newStatus }
        : order
    );
    setOrders(updatedOrders);
  
    try {
      const order = orders.find(order => order.id === orderId);
      if (order && newStatus === OrderStatus.Delivered) {
        const table = tables.find(table => table.tableNumber === order.tableNumber);
        if (table) {
          const newBalance = parseFloat((table.orders.reduce((acc, order) => acc + (order.orderStatus === OrderStatus.Delivered ? parseFloat(order.orderBalance) : 0), 0) + parseFloat(order.orderBalance)).toFixed(2));
          await fetch('/api/data?type=updateTableBalance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableId: table.id, newBalance }),
          });
        }
      }
  
      await fetch('/api/data?type=updateOrderStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, newStatus }),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const payForTable = async (tableId: number) => {
    try {
      // Remove all order entries for the table from the database
      await fetch('/api/data?type=deleteOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId }),
      });

      // Update the table_info database
      await fetch('/api/data?type=updateTableInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId, total: 0.00, balance: 0.00, help: 0 }),
      });

      // Update local state to reflect the changes
      setTables(prevTables => prevTables.map(table => 
        table.id === tableId ? { ...table, orders: [], status: TableStatus.Available } : table
      ));
      setOrders(prevOrders => prevOrders.filter(order => order.tableNumber !== tableId));
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Front of House</h1>
        <div className="flex items-center space-x-4">
          {isFilterMode && (
            <Button 
              onClick={clearTableSelection}
              className="bg-gray-200 text-black hover:bg-gray-300"
            >
              Reset
            </Button>
          )}
          <Button 
            onClick={() => setIsFilterMode(!isFilterMode)}
            className="bg-gray-200 text-black hover:bg-gray-300"
          >
            {isFilterMode ? "Confirm" : "Filter View"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((item) => (
          <Card 
            key={item.id} 
            className={`shadow-lg ${getTableStatusColor(item.status)} ${isFilterMode && !selectedTables.includes(item.tableNumber) ? "opacity-50" : ""}`}
            onClick={() => isFilterMode && toggleTableSelection(item.tableNumber)}
          >
            <CardHeader className={`text-black rounded-t-lg`}>
              <div className="text-3xl font-black">
                <h2>{`Table ${item.tableNumber}`}</h2>
              </div>
              <CardDescription className="font-bold text-black text-xl ">{item.status}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.orders.map((order) => (
                <Card key={order.id} className={`mb-2 shadow-md ${getStatusColor(order.orderStatus)}`}>
                  <CardContent className="py-3 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-10">
                        <div>
                          <div className="text-sm text-gray-500">Order</div>
                          <CardTitle className="text-xl">#{order.orderNumber}</CardTitle>
                        </div>
                        <CardDescription className="font-medium text-lg">{order.orderStatus}</CardDescription>
                      </div>
                      {order.orderStatus === OrderStatus.ReadyToDeliver && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, OrderStatus.Delivered)}
                          className="bg-blue-400 text-white px-2 py-5 rounded hover:bg-blue-600 transition-colors font-medium "
                          size="sm"
                        >
                          Deliver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {item.orders.some(order => order.orderStatus === OrderStatus.Delivered) && (
                <>
                  <p className="pt-3 text-sm text-gray-500">Total: ${item.orders.reduce((acc, order) => acc + parseFloat(order.orderBalance), 0).toFixed(2)}</p>
                </>
              )}
            </CardContent>
            <CardFooter>
              {item.orders.some(order => order.orderStatus === OrderStatus.Delivered) && (
                <Button
                  onClick={() => payForTable(item.tableNumber)}
                  className="w-full mr-2 bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600 transition "
                >
                  Pay
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}