"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [sortConfig, setSortConfig] = useState<{
    key: 'deviceId' | 'table' | 'battery';
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<typeof tempDevices[0] | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTableNumber, setEditTableNumber] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newTableNumber, setNewTableNumber] = useState<number>(0);

  const updateDevicesList = async () => {
    const response = await fetch('/api/data?type=getDevices');
    const data = await response.json();
    const formattedDevices = data.map((item: { TableID: number, DeviceID: string }) => ({
      deviceId: item.DeviceID,
      table: item.TableID,
      battery: 100,
      screen: "QR Menu",
      status: "Online",
    }));
    setDevices(formattedDevices);
  };

  useEffect(() => {
    updateDevicesList();
  }, []);

  const sortedDevices = [...devices].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: 'deviceId' | 'table' | 'battery') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditClick = (device: typeof tempDevices[0]) => {
    setSelectedDevice(device);
    setEditTableNumber(device.table);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedDevice) {
      const response = await fetch('/api/data?type=deleteDevice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: selectedDevice.deviceId,
        }),
      });

      if (response.ok) {
        await updateDevicesList();
      }
    }

    setIsEditDialogOpen(false);
    setSelectedDevice(null);
  };

  const handleSave = async () => {
    if (selectedDevice) {
      const response = await fetch('/api/data?type=updateDevice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: selectedDevice.deviceId,
          newTableId: editTableNumber,
        }),
      });

      if (response.ok) {
        await updateDevicesList();
      }
    }
  
    setIsEditDialogOpen(false);
    setSelectedDevice(null);
  };

  const handleAdd = async () => {
    // Validate deviceId is unique before adding
    const response = await fetch('/api/data?type=addDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableId: newTableNumber,
        deviceId: newDeviceId,
      }),
    });

    if (response.ok) {
      await updateDevicesList();
    }

    setIsAddDialogOpen(false);
    setNewDeviceId("");
    setNewTableNumber(devices.length + 1);
  };

  return (
    <div className="sm:p-6 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold">mC-Connect Devices</h1>
        <Button onClick={() => {
          setIsAddDialogOpen(true);
          setNewTableNumber(devices.length + 1);
        }}>Add</Button>
      </div>
      
      <Card className="p-2 sm:p-4 md:p-8 bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('deviceId')} className="cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                Device ID <ArrowUpDown className="hidden sm:inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead onClick={() => requestSort('table')} className="cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                Table # <ArrowUpDown className="hidden sm:inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead onClick={() => requestSort('battery')} className="cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                Battery <ArrowUpDown className="hidden sm:inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead className="whitespace-nowrap">Screen</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDevices.map((device) => (
              <TableRow key={device.deviceId}>
                <TableCell className="font-medium">{device.deviceId}</TableCell>
                <TableCell>{device.table}</TableCell>
                <TableCell>{device.battery}%</TableCell>
                <TableCell>{device.screen}</TableCell>
                <TableCell>{device.status}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => handleEditClick(device)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device ID: {selectedDevice?.deviceId}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Table Number</label>
            <Input
              type="number"
              value={editTableNumber}
              onChange={(e) => setEditTableNumber(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Device
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Device ID</label>
              <Input
                type="text"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                className="mt-1"
                placeholder="Enter device ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Table Number</label>
              <Input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(Number(e.target.value))}
                className="mt-1"
                placeholder="Enter table number"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newDeviceId.trim() || newTableNumber <= 0}
            >
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}