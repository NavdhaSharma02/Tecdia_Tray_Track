import {
  findCustomerByEmployeeCode,
  findCustomerById,
} from "@/lib/customer-auth";
import { getCustomerAccountBalance } from "@/lib/customer-activity-db";
import type { Employee } from "@/types";

async function toEmployeeProfile(
  customer: {
    id: string;
    employeeCode: string;
    email: string;
    fullName: string;
    department: string;
    createdAt: string;
  }
): Promise<Employee> {
  const accountBalance = await getCustomerAccountBalance(customer.id);
  return {
    id: customer.employeeCode,
    name: customer.fullName,
    email: customer.email,
    department: customer.department,
    avatar: null,
    accountBalance,
    joinDate: customer.createdAt,
    status: "active",
  };
}

export async function getEmployeeProfileByCode(
  employeeCode: string
): Promise<Employee | null> {
  const customer = await findCustomerByEmployeeCode(employeeCode);
  if (!customer) return null;
  return toEmployeeProfile(customer);
}

export async function getEmployeeProfileByCustomerId(
  customerId: string
): Promise<Employee | null> {
  const customer = await findCustomerById(customerId);
  if (!customer) return null;
  return toEmployeeProfile(customer);
}
