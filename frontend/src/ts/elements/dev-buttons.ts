import { envConfig } from "../constants/env-config";
import { showPopup } from "../modals/simple-modals";

export function append(): void {
  $("body").prepend(
    `
      <div class="devButtons">
        <a class='button configureAPI' href='${envConfig.backendUrl}/configure/' target='_blank' aria-label="Configure API" data-balloon-pos="right"><i class="fas fa-fw fa-server"></i></a>
        <button id="testData" class='button' aria-label="Test Data" data-balloon-pos="right"><i class="fas fa-fw fa-table"></i></button>
      <div>
      `
  );
  $(".devButtons").on("click", "#testData", () => {
    showPopup("devTestData");
  });
}
