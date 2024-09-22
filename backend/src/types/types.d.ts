type ObjectId = import("mongodb").ObjectId;

declare namespace MonkeyTypes {
  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };
}
