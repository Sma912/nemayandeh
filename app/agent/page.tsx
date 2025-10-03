"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, LogOut, UserPlus, Upload, MessageSquare, FileText, Eye, Plus, Download } from "lucide-react"
import { type Loan, type User, type SystemSettings, type Guarantor, STORAGE_KEYS, initializeDemoData } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatInterface } from "@/components/chat-interface"
import { LoanStatusView } from "@/components/loan-status-view"
import { Textarea } from "@/components/ui/textarea"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export default function AgentPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" })
  const [newLoan, setNewLoan] = useState({
    customerId: "",
    amount: "",
    loanTypeId: "",
    loanPurpose: "" as "" | "refaheston" | "agent" | "cash" | "cash_unavailable",
    formData: {} as Record<string, string>,
  })
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [chatLoanId, setChatLoanId] = useState<string | null>(null)
  const [statusLoan, setStatusLoan] = useState<Loan | null>(null)
  const [guarantorForm, setGuarantorForm] = useState<Record<string, string>>({})
  const [isAddGuarantorOpen, setIsAddGuarantorOpen] = useState(false)
  const [selectedGuarantorId, setSelectedGuarantorId] = useState<string | null>(null)
  const [guarantorDocFile, setGuarantorDocFile] = useState<File | null>(null)
  const [checkDetails, setCheckDetails] = useState({
    sayadNumber: "",
    bankName: "",
    ownerName: "",
  })

  useEffect(() => {
    if (!user || user.role !== "agent") {
      router.push("/login")
      return
    }

    initializeDemoData()
    loadData()

    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [user, router])

  const loadData = () => {
    const storedLoans = localStorage.getItem(STORAGE_KEYS.LOANS)
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)

    if (storedLoans) setLoans(JSON.parse(storedLoans))
    if (storedUsers) setUsers(JSON.parse(storedUsers))
    if (storedSettings) setSettings(JSON.parse(storedSettings))
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return

    const generatePassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
      let password = ""
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password
    }

    const normalizedPhone = normalizePhoneNumber(newCustomer.phone)

    const customer: User = {
      id: `customer-${Date.now()}`,
      name: newCustomer.name,
      phone: normalizedPhone,
      role: "customer",
      password: generatePassword(),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [...users, customer]
    setUsers(updatedUsers)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

    setNewCustomer({ name: "", phone: "" })
    setIsAddCustomerOpen(false)
  }

  const handleAddLoan = () => {
    if (!newLoan.customerId || !newLoan.amount || !newLoan.loanTypeId || !newLoan.loanPurpose || !user) return

    const customer = users.find((u) => u.id === newLoan.customerId)
    const loanType = settings?.loanTypes.find((lt) => lt.id === newLoan.loanTypeId)
    if (!customer || !loanType) return

    const loan: Loan = {
      id: `loan-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      agentId: user.id,
      agentName: user.name,
      amount: Number.parseFloat(newLoan.amount),
      status: "pending",
      loanType: loanType.id,
      loanTypeName: loanType.name,
      loanPurpose: newLoan.loanPurpose,
      purchaseFromRefaheston: newLoan.loanPurpose === "refaheston",
      creditCheckFee: loanType.creditCheckFee,
      commission: (Number.parseFloat(newLoan.amount) * loanType.commissionRate) / 100,
      guarantors: [],
      documents: [],
      creditCheck: {
        paid: false,
        amount: loanType.creditCheckFee,
      },
      contract: {},
      formData: newLoan.formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedLoans = [...loans, loan]
    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))

    setNewLoan({ customerId: "", amount: "", loanTypeId: "", loanPurpose: "", formData: {} })
    setIsAddLoanOpen(false)
  }

  const handleAddGuarantor = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId)
    const loanType = settings?.loanTypes.find((lt) => lt.id === loan?.loanType)
    if (!loan || !loanType) return

    const guarantor: Guarantor = {
      id: `guarantor-${Date.now()}`,
      name: guarantorForm.name || "",
      phone: guarantorForm.phone || "",
      nationalId: guarantorForm.nationalId || "",
      relationship: guarantorForm.relationship || "",
      documents: [],
      formData: guarantorForm,
      status: "pending",
    }

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          guarantors: [...l.guarantors, guarantor],
          updatedAt: new Date().toISOString(),
        }
      }
      return l
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setGuarantorForm({})
    setIsAddGuarantorOpen(false)
  }

  const handleUploadDocument = (
    loanId: string,
    category: "customer" | "guarantor" | "credit_check" | "contract" | "check" | "receipt",
    guarantorId?: string,
  ) => {
    if (!documentFile) return

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: documentFile.name,
          type: documentFile.type,
          category,
          url: URL.createObjectURL(documentFile),
          uploadedAt: new Date().toISOString(),
          guarantorId,
        }
        return {
          ...loan,
          documents: [...loan.documents, newDoc],
          updatedAt: new Date().toISOString(),
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
    setSelectedLoan(null)
  }

  const handleUploadCreditCheckReceipt = (loanId: string) => {
    if (!documentFile) return

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: documentFile.name,
          type: documentFile.type,
          category: "credit_check" as const,
          url: URL.createObjectURL(documentFile),
          uploadedAt: new Date().toISOString(),
        }
        return {
          ...loan,
          documents: [...loan.documents, newDoc],
          creditCheck: {
            ...loan.creditCheck,
            paid: true,
            receiptUrl: newDoc.url,
            paidAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
  }

  const handleUploadGuarantorDocument = (loanId: string, guarantorId: string) => {
    if (!guarantorDocFile) return

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: guarantorDocFile.name,
          type: guarantorDocFile.type,
          url: URL.createObjectURL(guarantorDocFile),
          uploadedAt: new Date().toISOString(),
        }

        const updatedGuarantors = loan.guarantors.map((g) => {
          if (g.id === guarantorId) {
            return {
              ...g,
              documents: [...g.documents, newDoc],
            }
          }
          return g
        })

        return {
          ...loan,
          guarantors: updatedGuarantors,
          updatedAt: new Date().toISOString(),
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setGuarantorDocFile(null)
    setSelectedGuarantorId(null)
  }

  const handleUploadCheck = (loanId: string) => {
    if (!documentFile || !user) return

    const loan = loans.find((l) => l.id === loanId)
    if (!loan) return

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          checkInfo: {
            amount: l.amount,
            imageUrl: URL.createObjectURL(documentFile),
            title: "خرید کالا",
            customerName: l.customerName,
            sayadNumber: checkDetails.sayadNumber,
            bankName: checkDetails.bankName,
            ownerName: checkDetails.ownerName,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.id,
          },
          status: "check_received" as const,
          updatedAt: new Date().toISOString(),
        }
      }
      return l
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
    setCheckDetails({ sayadNumber: "", bankName: "", ownerName: "" })
  }

  const handleUploadCheckDeliveryReceipt = (loanId: string) => {
    if (!documentFile || !user) return

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId && l.returnReceipt) {
        return {
          ...l,
          returnReceipt: {
            ...l.returnReceipt,
            deliveryReceiptUrl: URL.createObjectURL(documentFile),
            deliveredAt: new Date().toISOString(),
          },
          status: "check_delivered" as const,
          updatedAt: new Date().toISOString(),
        }
      }
      return l
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
  }

  const handleUploadFeeReceipt = (loanId: string) => {
    if (!documentFile) return

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: documentFile.name,
          type: documentFile.type,
          category: "fee_receipt" as const,
          url: URL.createObjectURL(documentFile),
          uploadedAt: new Date().toISOString(),
        }
        return {
          ...loan,
          documents: [...loan.documents, newDoc],
          updatedAt: new Date().toISOString(),
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
  }

  const handleUploadWalletReceipt = (loanId: string) => {
    if (!documentFile) return

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: documentFile.name,
          type: documentFile.type,
          category: "wallet_recharge" as const,
          url: URL.createObjectURL(documentFile),
          uploadedAt: new Date().toISOString(),
        }
        return {
          ...loan,
          documents: [...loan.documents, newDoc],
          updatedAt: new Date().toISOString(),
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setDocumentFile(null)
  }

  const shareCustomerCredentials = (customer: User, method: "sms" | "whatsapp" | "telegram") => {
    const loginUrl = window.location.origin + "/login"
    const message = `سلام ${customer.name}، حساب شما در سیستم لون‌فلو ایجاد شد.
نام کاربری: ${customer.phone}
رمز عبور: ${customer.password}
لینک ورود: ${loginUrl}`

    const encodedMessage = encodeURIComponent(message)

    if (method === "sms") {
      window.open(`sms:${customer.phone}?body=${encodedMessage}`, "_blank")
    } else if (method === "whatsapp") {
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank")
    } else if (method === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(loginUrl)}&text=${encodedMessage}`, "_blank")
    }
  }

  const myLoans = loans.filter((l) => l.agentId === user?.id)
  const customers = users.filter((u) => u.role === "customer")

  const getStatusColor = (status: Loan["status"]) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      under_review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      disbursed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      check_received: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      check_delivered: "bg-teal-500/10 text-teal-500 border-teal-500/20",
      return_receipt_issued: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    }
    return colors[status]
  }

  const getStatusText = (status: Loan["status"]) => {
    const statusTexts = {
      pending: "در انتظار",
      under_review: "در حال بررسی",
      approved: "تایید شده",
      rejected: "رد شده",
      disbursed: "پرداخت شده",
      completed: "تکمیل شده",
      check_received: "چک دریافت شد",
      check_delivered: "چک تحویل شد",
      return_receipt_issued: "رسید عودت صادر شد",
    }
    return statusTexts[status]
  }

  const selectedLoanType = settings?.loanTypes.find((lt) => lt.id === newLoan.loanTypeId)

  const getLoanPurposeText = (purpose?: string) => {
    const purposes = {
      refaheston: "خرید کالا از رفاهستون",
      agent: "خرید کالا از نماینده",
      cash: "دریافت وجه",
      cash_unavailable: "دریافت وجه جهت خرید کالای ناموجود",
    }
    return purposes[purpose as keyof typeof purposes] || "نامشخص"
  }

  if (!user || user.role !== "agent") return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">پنل کارمند لون‌فلو</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">کارمند وام</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وام‌های من</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLoans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">در انتظار</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLoans.filter((l) => l.status === "pending").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تایید شده</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLoans.filter((l) => l.status === "approved").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="loans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">وام‌های من</TabsTrigger>
          <TabsTrigger value="customers">مشتریان</TabsTrigger>
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
        </TabsList>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>درخواست‌های وام</CardTitle>
                    <CardDescription>مدیریت درخواست‌های وام شما</CardDescription>
                  </div>
                  <Dialog open={isAddLoanOpen} onOpenChange={setIsAddLoanOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        وام جدید
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>ایجاد وام جدید</DialogTitle>
                        <DialogDescription>ثبت درخواست وام جدید با اطلاعات کامل</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer">مشتری</Label>
                          <select
                            id="customer"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newLoan.customerId}
                            onChange={(e) => setNewLoan({ ...newLoan, customerId: e.target.value })}
                          >
                            <option value="">انتخاب مشتری</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} - {customer.phone}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loanType">نوع وام</Label>
                          <select
                            id="loanType"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newLoan.loanTypeId}
                            onChange={(e) => setNewLoan({ ...newLoan, loanTypeId: e.target.value, formData: {} })}
                          >
                            <option value="">انتخاب نوع وام</option>
                            {settings?.loanTypes.map((loanType) => (
                              <option key={loanType.id} value={loanType.id}>
                                {loanType.name} - هزینه اعتبارسنجی: {loanType.creditCheckFee.toLocaleString()} تومان
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">مبلغ وام</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={newLoan.amount}
                            onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
                            placeholder="مبلغ را وارد کنید"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loanPurpose">
                            دلیل استفاده از وام <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="loanPurpose"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newLoan.loanPurpose}
                            onChange={(e) =>
                              setNewLoan({
                                ...newLoan,
                                loanPurpose: e.target.value as
                                  | ""
                                  | "refaheston"
                                  | "agent"
                                  | "cash"
                                  | "cash_unavailable",
                              })
                            }
                            required
                          >
                            <option value="">انتخاب دلیل استفاده</option>
                            <option value="refaheston">خرید کالا از رفاهستون</option>
                            <option value="agent">خرید کالا از نماینده</option>
                            <option value="cash">دریافت وجه</option>
                            <option value="cash_unavailable">
                              دریافت وجه جهت خرید کالای ناموجود رفاهستون و نماینده
                            </option>
                          </select>
                        </div>

                        {selectedLoanType && selectedLoanType.requiredFields.length > 0 && (
                          <div className="space-y-4 rounded-lg border border-border p-4">
                            <h3 className="font-semibold">اطلاعات مورد نیاز مشتری</h3>
                            {selectedLoanType.requiredFields.map((field) => (
                              <div key={field} className="space-y-2">
                                <Label htmlFor={`field-${field}`}>{field}</Label>
                                <Input
                                  id={`field-${field}`}
                                  value={newLoan.formData[field] || ""}
                                  onChange={(e) =>
                                    setNewLoan({
                                      ...newLoan,
                                      formData: { ...newLoan.formData, [field]: e.target.value },
                                    })
                                  }
                                  placeholder={`${field} را وارد کنید`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedLoanType && selectedLoanType.requiresGuarantors && (
                          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                            <p className="text-sm text-yellow-600">
                              این نوع وام نیاز به حداقل {selectedLoanType.minGuarantors} ضامن دارد. پس از ایجاد وام،
                              ضامن‌ها را اضافه کنید.
                            </p>
                          </div>
                        )}

                        <Button onClick={handleAddLoan} className="w-full">
                          ایجاد وام
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>مشتری</TableHead>
                      <TableHead>نوع وام</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>مدارک</TableHead>
                      <TableHead>ضامن</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.customerName}</p>
                            <p className="text-sm text-muted-foreground">{loan.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loan.loanTypeName || "نامشخص"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{(loan.amount || 0).toLocaleString()} تومان</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(loan.status)}>
                            {getStatusText(loan.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{loan.documents.length} فایل</TableCell>
                        <TableCell>{loan.guarantors.length} نفر</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setStatusLoan(loan)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Dialog
                              open={selectedLoan?.id === loan.id}
                              onOpenChange={(open) => {
                                setSelectedLoan(open ? loan : null)
                                if (!open) {
                                  setCheckDetails({ sayadNumber: "", bankName: "", ownerName: "" })
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Upload className="mr-2 h-4 w-4" />
                                  مدیریت
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>مدیریت وام - {loan.customerName}</DialogTitle>
                                  <DialogDescription>
                                    بارگذاری مدارک، افزودن ضامن و مدیریت اطلاعات وام
                                  </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="documents" className="space-y-4">
                                  <TabsList className="grid grid-cols-5 w-full">
                                    <TabsTrigger value="documents">مدارک</TabsTrigger>
                                    <TabsTrigger value="credit-check">اعتبارسنجی</TabsTrigger>
                                    <TabsTrigger value="guarantors">ضامن‌ها</TabsTrigger>
                                    {loan.status === "approved" && <TabsTrigger value="check">چک</TabsTrigger>}
                                    <TabsTrigger value="payment">واریز وجه</TabsTrigger>
                                    {loan.status === "return_receipt_issued" && loan.returnReceipt && (
                                      <TabsTrigger value="delivery">تحویل</TabsTrigger>
                                    )}
                                  </TabsList>

                                  <TabsContent value="documents" className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="document">بارگذاری مدرک مشتری</Label>
                                        <Input
                                          id="document"
                                          type="file"
                                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                          onClick={() => handleUploadDocument(loan.id, "customer")}
                                          className="w-full"
                                          disabled={!documentFile}
                                        >
                                          آپلود مدرک
                                        </Button>
                                      </div>

                                      <div className="space-y-2">
                                        <h4 className="font-semibold">مدارک بارگذاری شده</h4>
                                        {loan.documents.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">هنوز مدرکی بارگذاری نشده است</p>
                                        ) : (
                                          <div className="space-y-2">
                                            {loan.documents.map((doc) => (
                                              <div
                                                key={doc.id}
                                                className="flex items-center justify-between rounded-lg border border-border p-3"
                                              >
                                                <div>
                                                  <p className="font-medium">{doc.name}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {new Date(doc.uploadedAt).toLocaleDateString("fa-IR")}
                                                  </p>
                                                </div>
                                                <Badge variant="outline">{doc.category}</Badge>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>پروفایل کارمند</CardTitle>
              <CardDescription>اطلاعات حساب و قرارداد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نام</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شماره موبایل</p>
                  <p className="font-medium">{user?.phone}</p>
                </div>
                {user?.nationalId && (
                  <div>
                    <p className="text-sm text-muted-foreground">کد ملی</p>
                    <p className="font-medium">{user.nationalId}</p>
                  </div>
                )}
                {user?.workDomain && (
                  <div>
                    <p className="text-sm text-muted-foreground">حوزه کاری</p>
                    <p className="font-medium">{user.workDomain}</p>
                  </div>
                )}
                {typeof user?.workExperienceYears === "number" && (
                  <div>
                    <p className="text-sm text-muted-foreground">سابقه کار</p>
                    <p className="font-medium">{user?.workExperienceYears} سال</p>
                  </div>
                )}
                {user?.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">آدرس</p>
                    <p className="font-medium">{user.address}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const storedText = user ? localStorage.getItem(`contract-text-${user.id}`) : null
                    if (storedText) {
                      const blob = new Blob([storedText], { type: "text/plain;charset=utf-8" })
                      const url = URL.createObjectURL(blob)
                      window.open(url, "_blank")
                      return
                    }
                    if (user?.contractUrl) {
                      window.open(user.contractUrl, "_blank")
                    }
                  }}
                >
                  مشاهده قرارداد
                </Button>
                {user?.signedContractUrl && (
                  <a href={user.signedContractUrl} download={`signed-contract-${user.id}.pdf`}>
                    <Button variant="default">دانلود قرارداد امضا شده</Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                                  <TabsContent value="credit-check" className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="rounded-lg border border-border p-4 space-y-2">
                                        <h4 className="font-semibold">اطلاعات اعتبارسنجی</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">هزینه اعتبارسنجی: </span>
                                            <span className="font-medium">
                                              {(loan.creditCheckFee || 0).toLocaleString()} تومان
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">وضعیت پرداخت: </span>
                                            <Badge
                                              variant="outline"
                                              className={
                                                loan.creditCheck.paid
                                                  ? "bg-green-500/10 text-green-500"
                                                  : "bg-yellow-500/10 text-yellow-500"
                                              }
                                            >
                                              {loan.creditCheck.paid ? "پرداخت شده" : "پرداخت نشده"}
                                            </Badge>
                                          </div>
                                        </div>
                                        {loan.creditCheck.paid && loan.creditCheck.paidAt && (
                                          <p className="text-sm text-muted-foreground">
                                            تاریخ پرداخت:{" "}
                                            {new Date(loan.creditCheck.paidAt).toLocaleDateString("fa-IR")}
                                          </p>
                                        )}
                                      </div>

                                      {settings?.bankCardNumber && (
                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                                          <p className="text-sm font-medium mb-2">شماره کارت برای واریز:</p>
                                          <p className="text-lg font-mono">{settings.bankCardNumber}</p>
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        <Label htmlFor="credit-check-receipt">
                                          بارگذاری رسید واریز هزینه اعتبارسنجی
                                        </Label>
                                        <Input
                                          id="credit-check-receipt"
                                          type="file"
                                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                          accept="image/*,.pdf"
                                        />
                                        <Button
                                          onClick={() => handleUploadCreditCheckReceipt(loan.id)}
                                          className="w-full"
                                          disabled={!documentFile}
                                        >
                                          آپلود رسید
                                        </Button>
                                      </div>

                                      {loan.creditCheck.receiptUrl && (
                                        <div className="rounded-lg border border-border p-4">
                                          <h4 className="font-semibold mb-2">رسید بارگذاری شده</h4>
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm">رسید واریز هزینه اعتبارسنجی</p>
                                            <Button variant="outline" size="sm" asChild>
                                              <a
                                                href={loan.creditCheck.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                مشاهده
                                              </a>
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="guarantors" className="space-y-4">
                                    <div className="space-y-4">
                                      <Dialog open={isAddGuarantorOpen} onOpenChange={setIsAddGuarantorOpen}>
                                        <DialogTrigger asChild>
                                          <Button className="w-full">
                                            <Plus className="mr-2 h-4 w-4" />
                                            افزودن ضامن
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                          <DialogHeader>
                                            <DialogTitle>افزودن ضامن جدید</DialogTitle>
                                            <DialogDescription>اطلاعات کامل ضامن را وارد کنید</DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="guarantor-name">نام و نام خانوادگی</Label>
                                              <Input
                                                id="guarantor-name"
                                                value={guarantorForm.name || ""}
                                                onChange={(e) =>
                                                  setGuarantorForm({ ...guarantorForm, name: e.target.value })
                                                }
                                                placeholder="نام کامل ضامن را وارد کنید"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="guarantor-phone">شماره تلفن</Label>
                                              <Input
                                                id="guarantor-phone"
                                                value={guarantorForm.phone || ""}
                                                onChange={(e) =>
                                                  setGuarantorForm({ ...guarantorForm, phone: e.target.value })
                                                }
                                                placeholder="شماره تلفن ضامن را وارد کنید"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="guarantor-nationalId">کد ملی</Label>
                                              <Input
                                                id="guarantor-nationalId"
                                                value={guarantorForm.nationalId || ""}
                                                onChange={(e) =>
                                                  setGuarantorForm({ ...guarantorForm, nationalId: e.target.value })
                                                }
                                                placeholder="کد ملی ضامن را وارد کنید"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="guarantor-relationship">نسبت با متقاضی</Label>
                                              <Input
                                                id="guarantor-relationship"
                                                value={guarantorForm.relationship || ""}
                                                onChange={(e) =>
                                                  setGuarantorForm({ ...guarantorForm, relationship: e.target.value })
                                                }
                                                placeholder="مثال: برادر، پدر، دوست"
                                              />
                                            </div>
                                            {settings?.loanTypes
                                              .find((lt) => lt.id === loan.loanType)
                                              ?.guarantorFields.filter(
                                                (field) => !["نام", "تلفن", "کد ملی", "نسبت"].includes(field),
                                              )
                                              .map((field) => (
                                                <div key={field} className="space-y-2">
                                                  <Label htmlFor={`guarantor-${field}`}>{field}</Label>
                                                  <Textarea
                                                    id={`guarantor-${field}`}
                                                    value={guarantorForm[field] || ""}
                                                    onChange={(e) =>
                                                      setGuarantorForm({ ...guarantorForm, [field]: e.target.value })
                                                    }
                                                    placeholder={`${field} را وارد کنید`}
                                                  />
                                                </div>
                                              ))}
                                            <Button onClick={() => handleAddGuarantor(loan.id)} className="w-full">
                                              افزودن ضامن
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                                      <div className="space-y-2">
                                        <h4 className="font-semibold">ضامن‌های معرفی شده</h4>
                                        {loan.guarantors.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">هنوز ضامنی معرفی نشده است</p>
                                        ) : (
                                          <div className="space-y-3">
                                            {loan.guarantors.map((guarantor) => (
                                              <div
                                                key={guarantor.id}
                                                className="rounded-lg border border-border p-4 space-y-3"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="font-medium">{guarantor.name}</p>
                                                    <p className="text-sm text-muted-foreground">{guarantor.phone}</p>
                                                  </div>
                                                  <Badge
                                                    variant="outline"
                                                    className={
                                                      guarantor.status === "approved"
                                                        ? "bg-green-500/10 text-green-500"
                                                        : guarantor.status === "rejected"
                                                          ? "bg-red-500/10 text-red-500"
                                                          : "bg-yellow-500/10 text-yellow-500"
                                                    }
                                                  >
                                                    {guarantor.status === "approved"
                                                      ? "تایید شده"
                                                      : guarantor.status === "rejected"
                                                        ? "رد شده"
                                                        : "در انتظار"}
                                                  </Badge>
                                                </div>
                                                <div className="text-sm space-y-1">
                                                  <p>
                                                    <span className="text-muted-foreground">کد ملی: </span>
                                                    {guarantor.nationalId}
                                                  </p>
                                                  <p>
                                                    <span className="text-muted-foreground">نسبت: </span>
                                                    {guarantor.relationship}
                                                  </p>
                                                  {guarantor.formData &&
                                                    Object.entries(guarantor.formData)
                                                      .filter(
                                                        ([key]) =>
                                                          !["name", "phone", "nationalId", "relationship"].includes(
                                                            key,
                                                          ),
                                                      )
                                                      .map(([key, value]) => (
                                                        <p key={key}>
                                                          <span className="text-muted-foreground">{key}: </span>
                                                          {value}
                                                        </p>
                                                      ))}
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-border">
                                                  <Label htmlFor={`guarantor-doc-${guarantor.id}`}>
                                                    مدارک ضامن ({guarantor.documents.length} فایل)
                                                  </Label>
                                                  {selectedGuarantorId === guarantor.id ? (
                                                    <div className="space-y-2">
                                                      <Input
                                                        id={`guarantor-doc-${guarantor.id}`}
                                                        type="file"
                                                        onChange={(e) =>
                                                          setGuarantorDocFile(e.target.files?.[0] || null)
                                                        }
                                                        accept="image/*,.pdf"
                                                      />
                                                      <div className="flex gap-2">
                                                        <Button
                                                          onClick={() =>
                                                            handleUploadGuarantorDocument(loan.id, guarantor.id)
                                                          }
                                                          size="sm"
                                                          disabled={!guarantorDocFile}
                                                          className="flex-1"
                                                        >
                                                          آپلود
                                                        </Button>
                                                        <Button
                                                          onClick={() => {
                                                            setSelectedGuarantorId(null)
                                                            setGuarantorDocFile(null)
                                                          }}
                                                          size="sm"
                                                          variant="outline"
                                                        >
                                                          انصراف
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <Button
                                                      onClick={() => setSelectedGuarantorId(guarantor.id)}
                                                      size="sm"
                                                      variant="outline"
                                                      className="w-full"
                                                    >
                                                      <Upload className="mr-2 h-4 w-4" />
                                                      بارگذاری مدرک
                                                    </Button>
                                                  )}

                                                  {guarantor.documents.length > 0 && (
                                                    <div className="space-y-1 mt-2">
                                                      {guarantor.documents.map((doc) => (
                                                        <div
                                                          key={doc.id}
                                                          className="flex items-center justify-between text-sm p-2 rounded bg-muted"
                                                        >
                                                          <span>{doc.name}</span>
                                                          <Button variant="ghost" size="sm" asChild>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                              <Eye className="h-3 w-3" />
                                                            </a>
                                                          </Button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TabsContent>

                                  {loan.status === "approved" && (
                                    <TabsContent value="check" className="space-y-4">
                                      <div className="space-y-4">
                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                                          <h4 className="font-semibold mb-2">اطلاعات چک (از تنظیمات سیستم)</h4>
                                          <div className="space-y-2 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">کد ملی صاحب چک: </span>
                                              <span className="font-medium font-mono">
                                                {settings?.checkOwnerNationalId || "تنظیم نشده"}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">مبلغ چک: </span>
                                              <span className="font-medium">
                                                {(loan.amount || 0).toLocaleString()} تومان
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">دلیل استفاده: </span>
                                              <span className="font-medium">
                                                {getLoanPurposeText(loan.loanPurpose)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="rounded-lg border border-border p-4 space-y-4">
                                          <h4 className="font-semibold">جزئیات چک مشتری</h4>
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label htmlFor="sayad-number">شماره صیاد</Label>
                                              <Input
                                                id="sayad-number"
                                                value={checkDetails.sayadNumber}
                                                onChange={(e) =>
                                                  setCheckDetails({ ...checkDetails, sayadNumber: e.target.value })
                                                }
                                                placeholder="شماره صیاد چک را وارد کنید"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="bank-name">نام بانک</Label>
                                              <Input
                                                id="bank-name"
                                                value={checkDetails.bankName}
                                                onChange={(e) =>
                                                  setCheckDetails({ ...checkDetails, bankName: e.target.value })
                                                }
                                                placeholder="نام بانک را وارد کنید"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="owner-name">نام صاحب چک</Label>
                                              <Input
                                                id="owner-name"
                                                value={checkDetails.ownerName}
                                                onChange={(e) =>
                                                  setCheckDetails({ ...checkDetails, ownerName: e.target.value })
                                                }
                                                placeholder="نام صاحب چک را وارد کنید"
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="check-image">تصویر چک</Label>
                                          <Input
                                            id="check-image"
                                            type="file"
                                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                            accept="image/*"
                                          />
                                          <Button
                                            onClick={() => handleUploadCheck(loan.id)}
                                            className="w-full"
                                            disabled={
                                              !documentFile ||
                                              !checkDetails.sayadNumber ||
                                              !checkDetails.bankName ||
                                              !checkDetails.ownerName
                                            }
                                          >
                                            ثبت و بارگذاری چک
                                          </Button>
                                        </div>

                                        {loan.checkInfo?.imageUrl && (
                                          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                                            <h4 className="font-semibold mb-2">چک بارگذاری شده</h4>
                                            <div className="space-y-2 text-sm">
                                              <div>
                                                <span className="text-muted-foreground">شماره صیاد: </span>
                                                <span className="font-medium">{loan.checkInfo.sayadNumber}</span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">بانک: </span>
                                                <span className="font-medium">{loan.checkInfo.bankName}</span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">صاحب چک: </span>
                                                <span className="font-medium">{loan.checkInfo.ownerName}</span>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="mt-2 bg-transparent"
                                              >
                                                <a
                                                  href={loan.checkInfo.imageUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  مشاهده تصویر چک
                                                </a>
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                  )}

                                  <TabsContent value="payment" className="space-y-4">
                                    <div className="space-y-4">
                                      {settings?.feePaymentAccount && (
                                        <div className="space-y-4">
                                          <div className="rounded-lg border border-border p-4 space-y-3">
                                            <h4 className="font-semibold">حساب دریافت هزینه امتیاز</h4>
                                            <p className="text-xs text-muted-foreground">
                                              مشتری باید پس از دریافت وام، هزینه امتیاز را به این حساب واریز کند
                                            </p>
                                            <div className="space-y-2 text-sm">
                                              <div>
                                                <span className="text-muted-foreground">نام بانک: </span>
                                                <span className="font-medium">
                                                  {settings.feePaymentAccount.bankName}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">صاحب حساب: </span>
                                                <span className="font-medium">
                                                  {settings.feePaymentAccount.accountHolderName}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">شماره حساب: </span>
                                                <span className="font-medium font-mono">
                                                  {settings.feePaymentAccount.accountNumber}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">شماره شبا: </span>
                                                <span className="font-medium font-mono">
                                                  {settings.feePaymentAccount.shebaNumber}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="fee-receipt">بارگذاری رسید واریز هزینه امتیاز</Label>
                                            <Input
                                              id="fee-receipt"
                                              type="file"
                                              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                              accept="image/*,.pdf"
                                            />
                                            <Button
                                              onClick={() => handleUploadFeeReceipt(loan.id)}
                                              className="w-full"
                                              disabled={!documentFile}
                                            >
                                              آپلود رسید هزینه امتیاز
                                            </Button>
                                          </div>

                                          {loan.documents.some((d) => d.category === "fee_receipt") && (
                                            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                                              <h4 className="font-semibold mb-2">رسید هزینه امتیاز بارگذاری شده</h4>
                                              {loan.documents
                                                .filter((d) => d.category === "fee_receipt")
                                                .map((doc) => (
                                                  <div key={doc.id} className="flex items-center justify-between mt-2">
                                                    <span className="text-sm">{doc.name}</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3 mr-1" />
                                                        دانلود
                                                      </a>
                                                    </Button>
                                                  </div>
                                                ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {loan.loanPurpose === "refaheston" && settings?.walletRechargeAccount && (
                                        <div className="space-y-4">
                                          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 space-y-3">
                                            <h4 className="font-semibold">حساب شارژ کیف پول رفاهستون</h4>
                                            <p className="text-xs text-muted-foreground">
                                              مشتری قصد خرید از رفاهستون دارد. برای شارژ کیف پول به این حساب واریز کند
                                            </p>
                                            <div className="space-y-2 text-sm">
                                              <div>
                                                <span className="text-muted-foreground">نام بانک: </span>
                                                <span className="font-medium">
                                                  {settings.walletRechargeAccount.bankName}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">صاحب حساب: </span>
                                                <span className="font-medium">
                                                  {settings.walletRechargeAccount.accountHolderName}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">شماره حساب: </span>
                                                <span className="font-medium font-mono">
                                                  {settings.walletRechargeAccount.accountNumber}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">شماره شبا: </span>
                                                <span className="font-medium font-mono">
                                                  {settings.walletRechargeAccount.shebaNumber}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="wallet-receipt">بارگذاری رسید شارژ کیف پول</Label>
                                            <Input
                                              id="wallet-receipt"
                                              type="file"
                                              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                              accept="image/*,.pdf"
                                            />
                                            <Button
                                              onClick={() => handleUploadWalletReceipt(loan.id)}
                                              className="w-full"
                                              disabled={!documentFile}
                                            >
                                              آپلود رسید شارژ کیف پول
                                            </Button>
                                          </div>

                                          {loan.documents.some((d) => d.category === "wallet_recharge") && (
                                            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                                              <h4 className="font-semibold mb-2">رسید شارژ کیف پول بارگذاری شده</h4>
                                              {loan.documents
                                                .filter((d) => d.category === "wallet_recharge")
                                                .map((doc) => (
                                                  <div key={doc.id} className="flex items-center justify-between mt-2">
                                                    <span className="text-sm">{doc.name}</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3 mr-1" />
                                                        دانلود
                                                      </a>
                                                    </Button>
                                                  </div>
                                                ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {loan.loanPurpose !== "refaheston" && (
                                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                                          <p className="text-sm text-yellow-600">
                                            حساب شارژ کیف پول فقط برای وام‌های با هدف خرید از رفاهستون نمایش داده می‌شود.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="delivery" className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                                        <p className="text-sm font-medium mb-2">رسید عودت چک صادر شده است</p>
                                        <p className="text-sm text-muted-foreground">
                                          لطفاً رسید را دانلود کرده، از مشتری امضا بگیرید و رسید تحویل را بارگذاری کنید.
                                        </p>
                                      </div>

                                      <Button variant="outline" className="w-full bg-transparent" asChild>
                                        <a href={loan.returnReceipt?.url || "#"} download>
                                          <Download className="mr-2 h-4 w-4" />
                                          دانلود رسید عودت چک
                                        </a>
                                      </Button>

                                      <div className="space-y-2">
                                        <Label htmlFor="delivery-receipt">رسید تحویل چک (امضا شده)</Label>
                                        <Input
                                          id="delivery-receipt"
                                          type="file"
                                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                          accept="image/*,.pdf"
                                        />
                                        <Button
                                          onClick={() => handleUploadCheckDeliveryReceipt(loan.id)}
                                          className="w-full"
                                          disabled={!documentFile}
                                        >
                                          بارگذاری رسید تحویل
                                        </Button>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="info" className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="rounded-lg border border-border p-4 space-y-2">
                                        <h4 className="font-semibold">اطلاعات وام</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">نوع وام: </span>
                                            <span className="font-medium">{loan.loanTypeName}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">مبلغ: </span>
                                            <span className="font-medium">
                                              {(loan.amount || 0).toLocaleString()} تومان
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">هزینه اعتبارسنجی: </span>
                                            <span className="font-medium">
                                              {(loan.creditCheckFee || 0).toLocaleString()} تومان
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">کارمزد: </span>
                                            <span className="font-medium">
                                              {(loan.commission || 0).toLocaleString()} تومان
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {loan.formData && Object.keys(loan.formData).length > 0 && (
                                        <div className="rounded-lg border border-border p-4 space-y-2">
                                          <h4 className="font-semibold">اطلاعات مشتری</h4>
                                          <div className="space-y-1 text-sm">
                                            {Object.entries(loan.formData).map(([key, value]) => (
                                              <div key={key}>
                                                <span className="text-muted-foreground">{key}: </span>
                                                <span className="font-medium">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" onClick={() => setChatLoanId(loan.id)}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>مشتریان</CardTitle>
                    <CardDescription>ثبت و مدیریت مشتریان</CardDescription>
                  </div>
                  <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        افزودن مشتری
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ثبت مشتری جدید</DialogTitle>
                        <DialogDescription>ایجاد حساب مشتری جدید</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer-name">نام</Label>
                          <Input
                            id="customer-name"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            placeholder="نام مشتری را وارد کنید"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer-phone">شماره تلفن</Label>
                          <Input
                            id="customer-phone"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            placeholder="شماره تلفن را وارد کنید"
                          />
                        </div>
                        <Button onClick={handleAddCustomer} className="w-full">
                          ثبت مشتری
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>رمز عبور</TableHead>
                      <TableHead>تاریخ ثبت</TableHead>
                      <TableHead>وام‌ها</TableHead>
                      <TableHead>اشتراک‌گذاری</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const customerLoans = myLoans.filter((l) => l.customerId === customer.id)
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                              {customer.password || "تنظیم نشده"}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(customer.createdAt).toLocaleDateString("fa-IR")}
                          </TableCell>
                          <TableCell>{customerLoans.length}</TableCell>
                          <TableCell>
                            {customer.password && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => shareCustomerCredentials(customer, "sms")}
                                  title="ارسال پیامک"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => shareCustomerCredentials(customer, "whatsapp")}
                                  title="ارسال واتساپ"
                                  className="text-green-600"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => shareCustomerCredentials(customer, "telegram")}
                                  title="ارسال تلگرام"
                                  className="text-blue-500"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                  </svg>
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {statusLoan && <LoanStatusView loan={statusLoan} open={!!statusLoan} onOpenChange={() => setStatusLoan(null)} />}

      {chatLoanId && <ChatInterface loanId={chatLoanId} onClose={() => setChatLoanId(null)} />}
    </div>
  )
}
