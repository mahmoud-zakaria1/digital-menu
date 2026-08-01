import { Document, Types } from "mongoose";

export interface IMealFields {
  name: string;
  description?: string;
  price: number;
  category: Types.ObjectId;
  image?: string;
  isAvailable: boolean;
}

export interface IMeal extends IMealFields, Document {}
