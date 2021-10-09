let list = null;

export async function getList() {
  if (list == null) {
    return $.getJSON("languages/britishenglish.json", function (data) {
      list = data;
      return list;
    });
  } else {
    return list;
  }
}

export async function replace(word) {
  let list = await getList();
  return list[list.findIndex((a) => a[0] === word)]?.[1];
}
