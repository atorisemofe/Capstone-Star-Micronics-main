"use client";

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ShoppingBag } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation";


interface FoodItem {
    id: number;
    name: string;
    description: string;
    destination: string;
    price: number;
    image: string;
}

export default function OrderPage() {
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get('table');
    const router = useRouter();
    useEffect(() => {
        if (!tableNumber) {
            router.push("/order?table=1");
        }
    }, [tableNumber, router]);
    const [cart, setCart] = useState<FoodItem[]>([]);
    const [menu, setMenu] = useState<FoodItem[]>([]);
    const { toast } = useToast();
    const addToCart = (item: { id: number; name: string; description: string; destination: string; price: number; image: string; }) => {
        toast({
            title: "Item added to cart",
            description: `${item.name} has been added to your cart.`,
        })
        setCart((prev) => [...prev, item]);
        console.log(cart);
    }

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const menuResponse = await fetch('/api/data?type=getMenu');
                const menuData = await menuResponse.json();

                const menu = menuData.map((item: any) => ({
                    id: item.ItemID,
                    name: item.name,
                    description: item.description,
                    destination: item.Destination,
                    price: parseFloat(item.Price),
                    image: item.image,
                }));

                setMenu(menu);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };
        fetchMenu();
    }, []);

    const placeOrder = async () => {
        if (cart.length === 0) {
            alert("Your cart is empty, add items to place an order.");
            return;
        }
        try {
            const response = await fetch(`/api/data?type=addOrders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tableId: tableNumber,
                    items: cart.map(item => ({
                        itemId: item.id,
                        destination: item.destination
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error(`Error placing order: ${response.statusText}`);
            }

            const result = await response.json();
            alert("Order placed successfully");
            console.log("Order response:", result);

            setCart([]);
        } catch (error) {
            console.error("Failed to place order:", error);
            alert("Failed to place order. Please try again.");
        }
    };
    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Menu</h1>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <ShoppingBag /> Cart
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Cart</SheetTitle>
                            <SheetDescription>Your selected items will appear here.</SheetDescription>
                        </SheetHeader>
                        {cart.length === 0 ? (
                            <p>Your cart is empty.</p>
                        ) : (
                            <ul>
                                {cart.map((item, index) => (
                                    <li key={index} className="flex items-center justify-between">
                                        <span>{item.name}</span>
                                        <span>${item.price.toFixed(2)}</span>
                                    </li>
                                ))
                                }
                            </ul>
                        )}
                        {cart.length > 0 && (
                            <div className="mt-4">
                                <p className="text-lg font-semibold">
                                    Total: ${cart.reduce((acc, item) => acc + item.price, 0).toFixed(2)}
                                </p>
                            </div>
                        )}
                        <Button
                            onClick={placeOrder}
                            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Place Order
                        </Button>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menu.map((item) => (
                    <Card key={item.id}>
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-40 object-cover rounded-t-[10px]"
                        />
                        <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">${item.price.toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => addToCart(item)}
                                className="ml-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                            >
                                Add to Cart
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>


    );
}