import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Table from "../models/table.schema.js";
import {
  createTableValidate,
  updateTableValidate,
} from "../validators/table.validator.js";
import { ITableFields } from "../types/table.types.js";
import { toObjectId } from "../utils/toObjectId.js";
import { assertExists } from "../utils/assertions.js";

type CreateTableInput = z.infer<typeof createTableValidate>;
type UpdateTableInput = z.infer<typeof updateTableValidate>;

// Helper to sanitize payload for table creation
const mapToTableDocument = (
  input: CreateTableInput,
): Pick<ITableFields, "tableNo"> => ({
  tableNo: input.tableNo,
});

// 1️⃣ Add New Dining Table
export const addTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validateData = createTableValidate.parse(req.body);

    // Prevent duplicate table numbers
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
    next(error);
  }
};

// 2️⃣ Get All Tables (Populates linked active order summary)
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

    return res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

// 3️⃣ Update Table Status & Order Association
export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tableId = toObjectId(req.params.id);

    const validatedData: UpdateTableInput = updateTableValidate.parse(req.body);

    const updatePayload: Partial<ITableFields> = {};

    if (validatedData.status) {
      updatePayload.status = validatedData.status;
    }

    if (validatedData.orderId) {
      updatePayload.currentOrder = toObjectId(validatedData.orderId);
    }

    const updateQuery: any = { $set: updatePayload };

    // Dynamically manage reservedAt field based on target status using $unset
    if (validatedData.status) {
      if (validatedData.status === "Reserved") {
        updatePayload.reservedAt = validatedData.reservedAt || new Date();
      } else {
        updateQuery.$unset = { reservedAt: "" };
      }
    }

    const updatedTable = await Table.findByIdAndUpdate(tableId, updateQuery, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!assertExists(updatedTable, "Table", next)) return;

    return res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: updatedTable,
    });
  } catch (error) {
    next(error);
  }
};

// 4️⃣ Delete Table (Guarded against active linked orders)
export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tableId = toObjectId(req.params.id);
    const table = await Table.findById(tableId);

    if(!assertExists(table, "Table", next)) return;

    // Block deletion if table has an unresolved order attached
    if (table.currentOrder) {
      const error: any = new Error(
        "Cannot delete table with an active order. Cancel or complete the order first.",
      );
      error.statusCode = 400;
      return next(error);
    }

    await Table.findByIdAndDelete(tableId);

    return res.status(200).json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// 5️⃣ Cancel Reservation (Resets status to Available and removes reservation timestamp)
export const cancelReservation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tableId = toObjectId(req.params.id);
    const table = await Table.findById(tableId);

    if (!assertExists(table, "Table", next)) return;

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
