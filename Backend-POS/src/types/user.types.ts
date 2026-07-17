import { Document } from "mongoose";

export interface IUserFields {
  name: string;
  email: string;
  age?: number;
  phone: string;
  password?: string;
  role: "Admin" | "Cashier" | "Customer";
}

export interface IUser extends IUserFields, Document {
  comparePassword(password: string): Promise<boolean>;
}