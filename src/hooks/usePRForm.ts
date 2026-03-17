import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PRFormData } from "../types/pr.types";

const lineItemSchema = z.object({
  id: z.string(),
  productName: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Price cannot be negative"),
  taxRate: z.number().nonnegative(),
  total: z.number(),
  category: z.string().min(1, "Category is required"),
  expectedDelivery: z.string().min(1, "Expected delivery is required"),
});

const prSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title cannot exceed 200 characters"),
  department: z.string().min(1, "Department is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  urgency: z.enum(["Low", "Medium", "High", "Critical"]),
  businessJustification: z.string()
    .min(1, "Justification is required")
    .max(1000, "Justification cannot exceed 1000 characters"),
  requestedBy: z.string().min(1, "Requested by is required"),
  requestDate: z.string(),
  requiredByDate: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, "Required date must be in the future"),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  vendorSelection: z.object({
    mode: z.enum(['existing', 'rfq', 'new', 'none']),
    selectedVendorId: z.string().optional(),
    rfqVendorIds: z.array(z.string()).optional(),
    newVendorData: z.any().optional(),
  }),
  budget: z.object({
    id: z.string(),
    name: z.string(),
    department: z.string(),
    availableBalance: z.number(),
    totalBudget: z.number(),
    currency: z.string(),
  }).optional(),
  delivery: z.object({
    locationType: z.enum(['default', 'saved', 'new']),
    address: z.object({
      building: z.string().optional(),
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    }),
    contact: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email(),
    }),
    instructions: z.string().optional(),
    shippingMethod: z.enum(['Standard', 'Express', 'Next day']),
    installationRequired: z.boolean(),
    trainingRequired: z.boolean(),
  }).optional(),
  status: z.enum(["Draft", "Approval Pending", "Approved", "Rejected", "PO Created"]),
  totalAmount: z.number(),
  attachments: z.array(z.any()),
  approvalChain: z.array(z.any()),
  termsAccepted: z.boolean(),
});

export const usePRForm = (defaultValues?: Partial<PRFormData>) => {
  return useForm<PRFormData>({
    resolver: zodResolver(prSchema),
    defaultValues: {
      title: "",
      department: "",
      category: "",
      urgency: "Medium",
      businessJustification: "",
      requestedBy: "Samay Maurya", // Mocked current user
      requestDate: new Date().toISOString().split('T')[0],
      requiredByDate: "",
      items: [],
      vendorSelection: {
        mode: 'none',
      },
      attachments: [],
      approvalChain: [],
      status: "Draft",
      totalAmount: 0,
      termsAccepted: false,
      ...defaultValues,
    },
    mode: "onChange",
  });
};
