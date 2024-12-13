"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"


export default function OrderPage() {
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get('table');
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0);
    const [tipPercentage, setTipPercentage] = useState(20);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [tempTipPercentage, setTempTipPercentage] = useState(tipPercentage);
    const [isThankYouDialogOpen, setIsThankYouDialogOpen] = useState(false);

    useEffect(() => {
        if (tableNumber) {
            fetch(`/api/data?type=getOrders&table=${tableNumber}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        const combinedOrders = data.reduce((acc, order) => {
                            const existingOrder = acc.find(o => o.itemId === order.itemId);
                            if (existingOrder) {
                                existingOrder.quantity += 1;
                            } else {
                                acc.push({ ...order, quantity: 1 });
                            }
                            return acc;
                        }, []);
                        setOrders(combinedOrders);
                    }
                })
                .catch(err => setError('Failed to fetch orders'));

            fetch(`/api/data?type=getTableInfo&table=${tableNumber}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setBalance(data.Balance);
                    }
                })
                .catch(err => setError('Failed to fetch table info'));
        }
    }, [tableNumber]);

    useEffect(() => {
        if (tableNumber) {
            const fetchTableInfo = () => {
                fetch(`/api/data?type=getTableInfo&table=${tableNumber}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            setError(data.error);
                        } else {
                            setBalance(data.Balance);
                        }
                    })
                    .catch(err => setError('Failed to fetch table info'));
            };

            fetchTableInfo();
            const intervalId = setInterval(fetchTableInfo, 60000); // Update every 60 seconds

            return () => clearInterval(intervalId);
        }
    }, [tableNumber]);

    useEffect(() => {
        if (tableNumber) {
            const fetchOrders = () => {
                fetch(`/api/data?type=getOrders&table=${tableNumber}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            setError(data.error);
                        } else {
                            const combinedOrders = data.reduce((acc, order) => {
                                const existingOrder = acc.find(o => o.itemId === order.itemId);
                                if (existingOrder) {
                                    existingOrder.quantity += 1;
                                } else {
                                    acc.push({ ...order, quantity: 1 });
                                }
                                return acc;
                            }, []);
                            setOrders(combinedOrders);
                        }
                    })
                    .catch(err => setError('Failed to fetch orders'));
            };

            fetchOrders();
            const intervalId = setInterval(fetchOrders, 5000); // Update every 5 seconds

            return () => clearInterval(intervalId);
        }
    }, [tableNumber]);

    const hasUndeliveredOrders = orders.some(order => order.Status !== 3);

    const orderSubtotal = orders.reduce((total, order) => total + (order.price * order.quantity), 0);
    const tipAmount = (orderSubtotal * tipPercentage) / 100;
    const totalBalance = Number(balance) + tipAmount;

    const handleConfirmTip = () => {
        setTipPercentage(tempTipPercentage);
        setIsPopupOpen(false);
    };

    const tempTipAmount = (orderSubtotal * tempTipPercentage) / 100;

    const payForTable = async () => {
        try {
            await fetch('/api/data?type=deleteOrders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tableId: tableNumber }),
            });

            await fetch('/api/data?type=updateTableInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tableId: tableNumber, total: 0.00, balance: 0.00, help: false }),
            });

            setOrders([]);
            setBalance(0);
            setTipPercentage(20);
            setIsThankYouDialogOpen(true);
        } catch (error) {
            setError('Error processing payment');
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold mb-8">Payment</h1>
            {tableNumber ? (
                <>
                    <p>Table Number: {tableNumber}</p>
                    {error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <>
                            <ul>
                                {orders.map(order => (
                                    <li key={order.itemId} className="flex justify-between">
                                        <span>{order.quantity} x {order.itemName}</span>
                                        <span>${Number(order.price).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                <p>Subtotal: ${orderSubtotal.toFixed(2)}</p>
                                <div className="flex items-center">
                                    <p className="mr-4">Tip: ${tipAmount.toFixed(2)} ({tipPercentage}%)</p>
                                    <Button className="bg-gray-200 text-black hover:bg-gray-300" onClick={() => setIsPopupOpen(true)}>Edit Tip</Button>
                                </div>
                                <p>Current Balance: ${totalBalance.toFixed(2)}</p>
                            </div>
                            <Button 
                                onClick={payForTable} 
                                className="w-full mt-4 bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                            >
                                Pay
                            </Button>
                        </>
                    )}
                </>
            ) : (
                <p className="text-red-500">Error: Table number is required in the URL.</p>
            )}

            <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Tip</DialogTitle>
                    </DialogHeader>
                    <Slider
                        min={0}
                        max={100}
                        value={[tempTipPercentage]}
                        onValueChange={(value) => setTempTipPercentage(value[0])}
                    />
                    <div className="flex mt-4">
                        <div className="w-1/2 flex items-center">
                            <input
                                type="number"
                                value={tempTipPercentage}
                                onChange={(e) => setTempTipPercentage(Number(e.target.value))}
                                className="p-2 border rounded w-full"
                            />
                            <span className="ml-2">%</span>
                        </div>
                        <div className="w-1/2 flex items-center justify-end">
                            <p>Total Tip: ${tempTipAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="flex w-full">
                            <Button className="w-1/2 mr-1" onClick={() => setIsPopupOpen(false)}>Cancel</Button>
                            <Button className="w-1/2 ml-1" onClick={handleConfirmTip}>Confirm</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isThankYouDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thank You!</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <p>Your payment has been successfully processed. Thank you for dining with us!</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}