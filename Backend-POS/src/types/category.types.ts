import { Document } from "mongoose";

export interface ICategoryFields {
  name: string;
  isActive: boolean;
}

export interface ICategory extends ICategoryFields, Document {}
