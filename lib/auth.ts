"use client"

export type UserRole = "admin" | "agent" | "customer"

export interface User {
  id: string
  phone: string
  name: string
  role: UserRole
  createdAt: string
  password?: string // Added password field for agents
  isActive?: boolean // Added isActive field to enable/disable agents
  // Agent profile fields
  firstName?: string
  lastName?: string
  nationalId?: string
  workDomain?: string
  workExperienceYears?: number
  address?: string
  postalCode?: string
  // Contract files
  contractUrl?: string
  signedContractUrl?: string
}

export interface Document {
  id: string
  name: string
  type: string
  category:
    | "customer"
    | "guarantor"
    | "credit_check"
    | "contract"
    | "check"
    | "receipt"
    | "fee_receipt"
    | "check_delivery"
    | "wallet_recharge"
  url: string
  uploadedAt: string
  guarantorId?: string
}

export interface Guarantor {
  id: string
  name: string
  phone: string
  nationalId: string
  relationship: string
  documents: Document[]
  formData?: Record<string, string>
  status?: "pending" | "approved" | "rejected"
}

export interface LoanType {
  id: string
  name: string
  creditCheckFee: number
  commissionRate: number
  requiredFields: string[]
  requiresGuarantors: boolean
  minGuarantors: number
  maxGuarantors: number
  guarantorFields: string[]
}

export interface CreditCheck {
  paid: boolean
  amount: number
  receiptUrl?: string
  paidAt?: string
  formData?: Record<string, string>
}

export interface CheckInfo {
  amount: number
  imageUrl?: string
  title: string // e.g., "خرید کالا"
  customerName: string
  sayadNumber?: string
  bankName?: string
  ownerName?: string
  uploadedAt?: string
  uploadedBy?: string
}

export interface FeePayment {
  amount: number
  accountNumber?: string
  shebaNumber?: string
  receiptUrl?: string
  paidAt?: string
  confirmedAt?: string
  confirmedBy?: string
}

export interface ReturnReceipt {
  generatedAt?: string
  generatedBy?: string
  downloadedAt?: string
  downloadedBy?: string
  deliveryReceiptUrl?: string
  deliveredAt?: string
}

export interface Contract {
  fileUrl?: string
  sentAt?: string
  sentBy?: string
  approvedAt?: string
  approvedBy?: string
  guaranteeCheckUrl?: string
  feeReceiptUrl?: string
  releaseOrderUrl?: string
  checkReturnReceiptUrl?: string
  signedAt?: string
  signedBy?: string
}

export type LoanStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "check_received"
  | "contract_sent"
  | "contract_approved"
  | "credit_transferred"
  | "fee_paid"
  | "return_receipt_issued"
  | "check_delivered"
  | "commission_paid"
  | "completed"
  | "rejected"

export interface Loan {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  agentId: string
  agentName: string
  amount: number
  status: LoanStatus
  loanType: string
  loanTypeName: string
  loanPurpose?: "refaheston" | "agent" | "cash" | "cash_unavailable" // Added loan purpose field
  creditCheckFee: number
  commission: number
  guarantors: Guarantor[]
  documents: Document[]
  creditCheck: CreditCheck
  contract: Contract
  checkInfo?: CheckInfo
  feePayment?: FeePayment
  returnReceipt?: ReturnReceipt
  commissionPaid?: boolean
  commissionPaidAt?: string
  formData?: Record<string, string>
  purchaseFromRefaheston?: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  loanId?: string
  senderId: string
  senderName: string
  senderRole: UserRole
  content: string
  timestamp: string
  type: "loan" | "admin-agent"
  recipientId?: string
}

export interface SystemSettings {
  loanTypes: LoanType[]
  requiredFields: string[]
  bankCardNumber: string
  accountNumber?: string
  shebaNumber?: string
  checkOwnerNationalId?: string
  feePaymentAccount?: BankAccount
  walletRechargeAccount?: BankAccount
}

// Storage keys
export const STORAGE_KEYS = {
  USER: "loan-app-user",
  LOANS: "loan-app-loans",
  USERS: "loan-app-users",
  MESSAGES: "loan-app-messages",
  SETTINGS: "loan-app-settings",
}

export const initializeDemoData = () => {
  if (typeof window === "undefined") return

  // Initialize users if not exists, or update admin user
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS)
  let users: User[] = []
  
  if (existingUsers) {
    users = JSON.parse(existingUsers)
    // Update admin user with correct credentials
    const adminIndex = users.findIndex(u => u.id === "admin-1")
    if (adminIndex !== -1) {
      users[adminIndex] = {
        ...users[adminIndex],
        phone: "09127831399",
        password: "refah1361",
        name: "مدیر سیستم",
      }
    } else {
      // Add admin user if not found
      users.unshift({
        id: "admin-1",
        phone: "09127831399",
        name: "مدیر سیستم",
        role: "admin" as UserRole,
        createdAt: new Date().toISOString(),
        password: "refah1361",
        isActive: true,
      })
    }
  } else {
    // Initialize all demo users
    users = [
      {
        id: "admin-1",
        phone: "09127831399",
        name: "مدیر سیستم",
        role: "admin" as UserRole,
        createdAt: new Date().toISOString(),
        password: "refah1361",
        isActive: true, // Admin is always active
      },
      {
        id: "agent-1",
        phone: "0987654321",
        name: "علی احمدی",
        role: "agent" as UserRole,
        createdAt: new Date().toISOString(),
        password: "agent123",
        isActive: true, // Agent is active by default
      },
      {
        id: "customer-1",
        phone: "5555555555",
        name: "محمد رضایی",
        role: "customer" as UserRole,
        createdAt: new Date().toISOString(),
        isActive: true, // Customer is active by default
      },
    ]
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings: SystemSettings = {
      loanTypes: [
        {
          id: "resalat",
          name: "رسالت",
          creditCheckFee: 250000,
          commissionRate: 2.5,
          requiredFields: ["نام", "نام خانوادگی", "کد ملی", "شماره تماس", "آدرس", "شغل", "درآمد ماهانه"],
          requiresGuarantors: true,
          minGuarantors: 1,
          maxGuarantors: 2,
          guarantorFields: ["نام", "نام خانوادگی", "کد ملی", "شماره تماس", "نسبت", "شغل"],
        },
        {
          id: "gharzolhasaneh",
          name: "قرض‌الحسنه",
          creditCheckFee: 150000,
          commissionRate: 1.5,
          requiredFields: ["نام", "نام خانوادگی", "کد ملی", "شماره تماس", "آدرس"],
          requiresGuarantors: false,
          minGuarantors: 0,
          maxGuarantors: 0,
          guarantorFields: [],
        },
        {
          id: "tejari",
          name: "تجاری",
          creditCheckFee: 500000,
          commissionRate: 5,
          requiredFields: [
            "نام",
            "نام خانوادگی",
            "کد ملی",
            "شماره تماس",
            "آدرس",
            "شغل",
            "درآمد ماهانه",
            "نام شرکت",
            "شماره ثبت شرکت",
          ],
          requiresGuarantors: true,
          minGuarantors: 2,
          maxGuarantors: 3,
          guarantorFields: ["نام", "نام خانوادگی", "کد ملی", "شماره تماس", "نسبت", "شغل", "درآمد ماهانه"],
        },
      ],
      requiredFields: ["نام", "نام خانوادگی", "کد ملی", "شماره تماس", "آدرس", "شغل", "درآمد ماهانه"],
      bankCardNumber: "6037-9971-1234-5678",
      accountNumber: "1234567890",
      shebaNumber: "IR123456789012345678901234",
      checkOwnerNationalId: "0123456789",
      feePaymentAccount: {
        accountNumber: "1234567890",
        shebaNumber: "IR123456789012345678901234",
        bankName: "بانک ملی",
        accountHolderName: "شرکت لون‌فلو",
      },
      walletRechargeAccount: {
        accountNumber: "9876543210",
        shebaNumber: "IR987654321098765432109876",
        bankName: "بانک سپه",
        accountHolderName: "رفاهستون",
      },
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings))
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
    const demoLoans: Loan[] = [
      {
        id: "loan-1",
        customerId: "customer-1",
        customerName: "محمد رضایی",
        customerPhone: "5555555555",
        agentId: "agent-1",
        agentName: "علی احمدی",
        amount: 50000000,
        status: "under_review",
        loanType: "resalat",
        loanTypeName: "رسالت",
        loanPurpose: "cash", // Added loan purpose field
        creditCheckFee: 250000,
        commission: 1250000,
        guarantors: [],
        documents: [],
        creditCheck: {
          paid: false,
          amount: 250000,
        },
        contract: {},
        formData: {},
        purchaseFromRefaheston: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(demoLoans))
  }

  // Initialize messages if not exists
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]))
  }
}

export interface BankAccount {
  accountNumber: string
  shebaNumber: string
  bankName: string
  accountHolderName: string
}
