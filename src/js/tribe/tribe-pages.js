import { swapElements } from "./ui";

let active = "preloader";
let transition = false;

export async function change(
  page,
  middleCallback = () => {},
  finishCallback = () => {}
) {
  return new Promise((resolve, reject) => {
    if (page === active) return;
    if (transition) return;
    transition = true;
    let activePage = $(".page.pageTribe .tribePage.active");
    swapElements(
      activePage,
      $(`.page.pageTribe .tribePage.${page}`),
      250,
      async () => {
        active = page;
        activePage.removeClass("active");
        $(`.page.pageTribe .tribePage.${page}`).addClass("active");
        transition = false;
        await finishCallback();
        resolve();
      },
      () => {
        middleCallback();
      }
    );
  });
}
