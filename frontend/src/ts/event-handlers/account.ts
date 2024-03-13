import * as PbTablesModal from "../modals/pb-tables";

const accountPage = document.querySelector("#pageAccount") as HTMLElement;

$(accountPage).on("click", ".pbsTime .showAllButton", () => {
  PbTablesModal.show("time");
});

$(accountPage).on("click", ".pbsWords .showAllButton", () => {
  PbTablesModal.show("words");
});
