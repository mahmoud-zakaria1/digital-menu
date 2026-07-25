import { Document } from "mongoose";

export interface IMealFields {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

export interface IMeal extends IMealFields, Document {}
