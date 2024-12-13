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

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">Settings</h1>

      <Card className="max-w-2xl p-8 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-8">Content</h2>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">Refresh between promotions:</label>
            <Input className="bg-slate-50 border-gray-200" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Setting:</label>
            <Select defaultValue="enabled">
              <SelectTrigger className="bg-slate-50 border-gray-200">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>
      </Card>
    </div>
  )
}