declare namespace ConfigsApe {
  type GetConfig = {
    _id: string;
    uid: string;
    config: Partial<MonkeyTypes.Config>;
  };
  type PostConfig = null;
}
