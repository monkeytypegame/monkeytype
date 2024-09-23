import { ObjectId } from "mongodb";

export type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
  _id: ObjectId;
};
