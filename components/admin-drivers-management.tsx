"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, User, Loader2, Users, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/types/database.types"

type DriverRow = Database['public']['Tables']['drivers']['Row']

interface AdminDriversManagementProps {
  dictionary: any
  onDriversUpdated?: () => Promise<void>
}

export default function AdminDriversManagement({ dictionary, onDriversUpdated }: AdminDriversManagementProps) {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [newDriverName, setNewDriverName] = useState("")
  const [newDriverPhone, setNewDriverPhone] = useState("")
  const [editDriverName, setEditDriverName] = useState("")
  const [editDriverPhone, setEditDriverPhone] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/drivers')
      const result = await response.json()

      if (result.success) {
        setDrivers(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch drivers",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new driver
  const createDriver = async () => {
    if (!newDriverName.trim()) return

    try {
      setCreating(true)
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDriverName.trim(),
          phone: newDriverPhone.trim() || null
        })
      })

      const result = await response.json()

      if (result.success) {
        setDrivers([...drivers, result.data])
        setNewDriverName("")
        setNewDriverPhone("")
        setShowCreateDialog(false)
        
        // Call parent callback to refresh drivers in dashboard
        if (onDriversUpdated) {
          await onDriversUpdated()
        }
        
        toast({
          title: "Success",
          description: "Driver created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create driver",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create driver",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // Edit driver
  const editDriver = async (driverId: string) => {
    if (!editDriverName.trim()) {
      toast({
        title: "Error",
        description: "Driver name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setEditing(driverId)
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editDriverName.trim(),
          phone: editDriverPhone.trim() || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Driver updated successfully",
        })
        setEditingDriverId(null)
        setEditDriverName("")
        setEditDriverPhone("")
        setShowEditDialog(false)
        
        // Call parent callback to refresh drivers in dashboard
        if (onDriversUpdated) {
          await onDriversUpdated()
        }
        
        fetchDrivers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update driver",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update driver",
        variant: "destructive"
      })
    } finally {
      setEditing(null)
    }
  }

  // Delete driver
  const deleteDriver = async (id: string) => {
    try {
      setDeleting(id)
      const response = await fetch(`/api/admin/drivers/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setDrivers(drivers.filter(driver => driver.id !== id))
        
        // Call parent callback to refresh drivers in dashboard
        if (onDriversUpdated) {
          await onDriversUpdated()
        }
        
        toast({
          title: "Success",
          description: "Driver deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete driver",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (driver: DriverRow) => {
    setEditingDriverId(driver.id)
    setEditDriverName(driver.name)
    setEditDriverPhone((driver as any).phone || "")
    setShowEditDialog(true)
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {dictionary.admin?.drivers?.title || "Drivers Management"}
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="text-white">
                <Plus className="mr-2 h-4 w-4" />
                {dictionary.admin?.drivers?.addDriver || "Add Driver"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>{dictionary.admin?.drivers?.addDriver || "Add Driver"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="driver-name">
                    {dictionary.admin?.drivers?.driverName || "Driver Name"}
                  </Label>
                  <Input
                    id="driver-name"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder={dictionary.admin?.drivers?.driverNamePlaceholder || "Enter driver name"}
                    disabled={creating}
                  />
                </div>
                <div>
                  <Label htmlFor="driver-phone">
                    {dictionary.admin?.drivers?.driverPhone || "Phone Number"}
                  </Label>
                  <Input
                    id="driver-phone"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    placeholder={dictionary.admin?.drivers?.driverPhonePlaceholder || "Enter phone number"}
                    disabled={creating}
                    type="tel"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setNewDriverName("")
                      setNewDriverPhone("")
                    }}
                    disabled={creating}
                  >
                    {dictionary.admin?.drivers?.cancel || "Cancel"}
                  </Button>
                  <Button
                    onClick={createDriver}
                    disabled={creating || !newDriverName.trim()}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dictionary.admin?.drivers?.create || "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{dictionary.admin?.drivers?.loading || "Loading drivers..."}</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Badge variant="secondary">
                {dictionary.admin?.drivers?.totalDrivers || "Total Drivers"}: {drivers.length}
              </Badge>
            </div>
            
            {drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>{dictionary.admin?.drivers?.noDrivers || "No drivers found"}</p>
                <p className="text-sm text-gray-400">
                  {dictionary.admin?.drivers?.noDriversDescription || "Add your first driver to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary.admin?.drivers?.name || "Name"}</TableHead>
                    <TableHead>{dictionary.admin?.drivers?.phone || "Phone"}</TableHead>
                    <TableHead>{dictionary.admin?.drivers?.createdAt || "Created"}</TableHead>
                    <TableHead>{dictionary.admin?.drivers?.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span className="font-medium">{driver.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {(driver as any).phone ? (
                            <>
                              <Phone className="mr-2 h-4 w-4 text-gray-500" />
                              <span className="text-sm">{(driver as any).phone}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              {dictionary.admin?.drivers?.noPhone || "No phone"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(driver.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(driver)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleting === driver.id}
                              >
                                {deleting === driver.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {dictionary.admin?.drivers?.deleteTitle || "Delete Driver"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {dictionary.admin?.drivers?.deleteDescription || "Are you sure you want to delete this driver? This action cannot be undone."}
                                  <br />
                                  <span className="font-medium">{driver.name}</span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {dictionary.admin?.drivers?.cancel || "Cancel"}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteDriver(driver.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {dictionary.admin?.drivers?.delete || "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{dictionary.admin?.drivers?.editDriver || "Edit Driver"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-driver-name">
                  {dictionary.admin?.drivers?.driverName || "Driver Name"}
                </Label>
                <Input
                  id="edit-driver-name"
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  placeholder={dictionary.admin?.drivers?.driverNamePlaceholder || "Enter driver name"}
                  disabled={editing !== null}
                />
              </div>
              <div>
                <Label htmlFor="edit-driver-phone">
                  {dictionary.admin?.drivers?.driverPhone || "Phone Number"}
                </Label>
                <Input
                  id="edit-driver-phone"
                  value={editDriverPhone}
                  onChange={(e) => setEditDriverPhone(e.target.value)}
                  placeholder={dictionary.admin?.drivers?.driverPhonePlaceholder || "Enter phone number"}
                  disabled={editing !== null}
                  type="tel"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditDriverName("")
                    setEditDriverPhone("")
                    setEditingDriverId(null)
                  }}
                  disabled={editing !== null}
                >
                  {dictionary.admin?.drivers?.cancel || "Cancel"}
                </Button>
                <Button
                  onClick={() => editDriver(editingDriverId || "")}
                  disabled={editing !== null || !editDriverName.trim()}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {editing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {dictionary.admin?.drivers?.updating || "Updating..."}
                    </>
                  ) : (
                    dictionary.admin?.drivers?.update || "Update"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 