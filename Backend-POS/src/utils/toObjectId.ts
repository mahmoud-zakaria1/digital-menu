import mongoose from "mongoose";

export const toObjectId = (id: string): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error(`Invalid ObjectId: ${id}`), {
      statusCode: 400,
    });
  }
  return new mongoose.Types.ObjectId(id);
};
