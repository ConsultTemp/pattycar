"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Loader2, Users, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type CustomerRow = {
  id: string
  name: string
  phone: string | null
  billing_info: string | null
  created_at: string
  updated_at: string
}

interface AdminCustomersManagementProps {
  dictionary: any
  onCustomersUpdated?: () => Promise<void>
}

export default function AdminCustomersManagement({ dictionary, onCustomersUpdated }: AdminCustomersManagementProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerBilling, setNewCustomerBilling] = useState("")
  const [editCustomerName, setEditCustomerName] = useState("")
  const [editCustomerPhone, setEditCustomerPhone] = useState("")
  const [editCustomerBilling, setEditCustomerBilling] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/customers')
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch customers",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create customer
  const createCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
          billing_info: newCustomerBilling.trim() || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
        setNewCustomerName("")
        setNewCustomerBilling("")
        setShowCreateDialog(false)
        
        // Call parent callback to refresh customers in dashboard
        if (onCustomersUpdated) {
          await onCustomersUpdated()
        }
        
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // Edit customer
  const editCustomer = async (customerId: string) => {
    if (!editCustomerName.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setEditing(customerId)
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCustomerName.trim(),
          billing_info: editCustomerBilling.trim() || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
        setEditingCustomerId(null)
        setEditCustomerName("")
        setEditCustomerBilling("")
        setShowEditDialog(false)
        
        // Call parent callback to refresh customers in dashboard
        if (onCustomersUpdated) {
          await onCustomersUpdated()
        }
        
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      })
    } finally {
      setEditing(null)
    }
  }

  // Delete customer
  const deleteCustomer = async (customerId: string) => {
    try {
      setDeleting(customerId)
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        })
        
        // Call parent callback to refresh customers in dashboard
        if (onCustomersUpdated) {
          await onCustomersUpdated()
        }
        
        fetchCustomers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete customer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (customer: CustomerRow) => {
    setEditingCustomerId(customer.id)
    setEditCustomerName(customer.name)
    setEditCustomerBilling(customer.billing_info || "")
    setShowEditDialog(true)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {dictionary.admin?.customers?.title || "Customers Management"}
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="text-white">
                <Plus className="mr-2 h-4 w-4" />
                {dictionary.admin?.customers?.addCustomer || "Add Customer"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>{dictionary.admin?.customers?.addCustomer || "Add Customer"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{dictionary.admin?.customers?.name || "Name"}</Label>
                  <Input
                    id="name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder={dictionary.admin?.customers?.namePlaceholder || "Enter customer name"}
                  />
                </div>
                <div>
                  <Label htmlFor="billing_info">{dictionary.admin?.customers?.billingInfo || "Billing Info"}</Label>
                  <Textarea
                    id="billing_info"
                    value={newCustomerBilling}
                    onChange={(e) => setNewCustomerBilling(e.target.value)}
                    placeholder={dictionary.admin?.customers?.billingPlaceholder || "Enter billing information"}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    {dictionary.admin?.customers?.cancel || "Cancel"}
                  </Button>
                  <Button onClick={createCustomer} disabled={creating} className="bg-black text-white hover:bg-gray-800">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {dictionary.admin?.customers?.creating || "Creating..."}
                      </>
                    ) : (
                      dictionary.admin?.customers?.create || "Create"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                {dictionary.admin?.customers?.loading || "Loading customers..."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.admin?.customers?.name || "Name"}</TableHead>
                  <TableHead>{dictionary.admin?.customers?.billingInfo || "Billing Info"}</TableHead>
                  <TableHead>{dictionary.admin?.customers?.createdAt || "Created"}</TableHead>
                  <TableHead>{dictionary.admin?.customers?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {dictionary.admin?.customers?.noCustomers || "No customers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-500" />
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {customer.billing_info || (
                            <span className="text-gray-400 italic">
                              {dictionary.admin?.customers?.noBillingInfo || "No billing info"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deleting === customer.id}
                              >
                                {deleting === customer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {dictionary.admin?.customers?.deleteTitle || "Delete Customer"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {dictionary.admin?.customers?.deleteDescription || "Are you sure you want to delete this customer? This action cannot be undone."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {dictionary.admin?.customers?.cancel || "Cancel"}
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCustomer(customer.id)} className="text-white">
                                  {dictionary.admin?.customers?.delete || "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dictionary.admin?.customers?.editCustomer || "Edit Customer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{dictionary.admin?.customers?.name || "Name"}</Label>
                <Input
                  id="edit-name"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder={dictionary.admin?.customers?.namePlaceholder || "Enter customer name"}
                />
              </div>
              <div>
                <Label htmlFor="edit-billing_info">{dictionary.admin?.customers?.billingInfo || "Billing Info"}</Label>
                <Textarea
                  id="edit-billing_info"
                  value={editCustomerBilling}
                  onChange={(e) => setEditCustomerBilling(e.target.value)}
                  placeholder={dictionary.admin?.customers?.billingPlaceholder || "Enter billing information"}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {dictionary.admin?.customers?.cancel || "Cancel"}
                </Button>
                <Button onClick={() => editCustomer(editingCustomerId || "")} disabled={editing !== null} className="bg-black text-white hover:bg-gray-800">
                  {editing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {dictionary.admin?.customers?.updating || "Updating..."}
                    </>
                  ) : (
                    dictionary.admin?.customers?.update || "Update"
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