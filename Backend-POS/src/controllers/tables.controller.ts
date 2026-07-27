import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError, z } from "zod";
import Table from "../models/table.schema.js";
import {
  createTableValidate,
  updateTableValidate,
} from "../validators/table.validator.js";
import { ITableFields } from "../types/table.types.js";
import { formatZodError } from "../utilis/formatZodError.js";

type CreateTableInput = z.infer<typeof createTableValidate>;
type UpdateTableInput = z.infer<typeof updateTableValidate>;

const mapToTableDocument = (
  input: CreateTableInput,
): Pick<ITableFields, "tableNo"> => ({
  tableNo: input.tableNo,
});

export const addTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validateData = createTableValidate.parse(req.body);

    const isTablePresent = await Table.findOne({
      tableNo: validateData.tableNo,
    });
    if (isTablePresent) {
      const error: any = new Error("Table already exists");
      error.statusCode = 400;
      return next(error);
    }

    const tableData = mapToTableDocument(validateData);
    const newTable = await Table.create(tableData);

    return res.status(201).json({
      success: true,
      message: "Table added successfully",
      data: newTable,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formatZodError(error),
      });
    }
    next(error);
  }
};

export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tables = await Table.find().populate(
      "currentOrder",
      "status totalPrice",
    );

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error("Invalid table id");
      error.statusCode = 400;
      return next(error);
    }

    const validateData: UpdateTableInput = updateTableValidate.parse(req.body);

    const updatePayload: Partial<ITableFields> = {
      status: validateData.status,
    };

    if (validateData.orderId) {
      updatePayload.currentOrder = new mongoose.Types.ObjectId(
        validateData.orderId,
      );
    }

    const updatedTable = await Table.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTable) {
      const error: any = new Error("Table not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: updatedTable,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formatZodError(error),
      });
    }
    next(error);
  }
};

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" ||!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error("Invalid table id");
      error.statusCode = 400;
      return next(error);
    }

    const table = await Table.findById(id);

    if (!table) {
      const error: any = new Error("Table not found");
      error.statusCode = 404;
      return next(error);
    }

    if (table.currentOrder) {
      const error: any = new Error(
        "Cannot delete table with an active order. Cancel or complete the order first.",
      );
      error.statusCode = 400;
      return next(error);
    }

    await Table.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error("Invalid table id");
      error.statusCode = 400;
      return next(error);
    }

    const table = await Table.findById(id);

    if (!table) {
      const error: any = new Error("Table not found");
      error.statusCode = 404;
      return next(error);
    }

    if (table.status !== "Reserved") {
      const error: any = new Error(
        `Cannot cancel reservation. Table status is "${table.status}", not "Reserved".`,
      );
      error.statusCode = 400;
      return next(error);
    }

    table.status = "Available";
    delete table.reservedAt;
    await table.save();

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled, table is now available",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};
