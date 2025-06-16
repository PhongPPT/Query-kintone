jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID) {
  "use strict";
  let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) return;
  let CONFIG_JSON = JSON.parse(CONFIG.config || "{}");
  console.log("CONFIG", CONFIG_JSON);

  // async function getAllRecords(appId) {
  //   let allRecords = [];
  //   let offset = 0;
  //   const limit = 500;

  //   while (true) {
  //     const response = await kintone.api(
  //       kintone.api.url("/k/v1/records", true),
  //       "GET",
  //       {
  //         app: appId,
  //         query: `limit ${limit} offset ${offset}`,
  //       }
  //     );

  //     allRecords = allRecords.concat(response.records);

  //     if (response.records.length < limit) {
  //       break; // No more records
  //     }

  //     offset += limit;
  //   }

  //   console.log("Total records:", allRecords.length);
  //   return allRecords;
  // }

  async function getAllRecords(appId) {
    const allRecords = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        {
          app: appId,
          query: `limit ${limit} offset ${offset}`,
        }
      );

      allRecords.push(...response.records);

      if (response.records.length < limit) break;
      offset += limit;
    }

    return allRecords;
  }

  // Check row function - fixed class names
  function checkRow() {
    let $rows = $("#kintoneplugin-setting-tspace > tr:not([hidden])");
    if ($rows.length <= 1) {
      $rows.find(".removeRow-main").hide();
    } else {
      $rows.find(".removeRow-main").show();
    }
  }

  // Check sub-row function
  function checkSubRow($subTable) {
    $subTable = $($subTable);
    let $subRows = $subTable.find("tbody > tr:not([hidden])");
    if ($subRows.length <= 1) {
      $subRows.find(".removeRow-sub").hide();
    } else {
      $subRows.find(".removeRow-sub").show();
    }
  }

  $(document).ready(function () {
    // Main layer: ensure at least one visible row
    let $tbody = $("#kintoneplugin-setting-tspace");
    let $templateRow = $tbody.find("tr.table-space").first();

    if ($templateRow.length && $tbody.find("tr:not([hidden])").length === 0) {
      let clonedRow = $templateRow.clone(true).removeAttr("hidden");

      // Clear main row inputs
      clonedRow.find('input[type="text"]').val("");
      clonedRow.find("select").prop("selectedIndex", 0);

      // For sub-layer: ensure at least one visible sub-row
      clonedRow.find(".sub-table").each(function () {
        let subTbody = $(this).find("tbody");
        let subTemplateRow = subTbody.find("tr").first();

        // Remove any existing visible sub-rows
        subTbody.find("tr:not(:first)").remove();

        // Create first visible sub-row from template
        if (subTemplateRow.length) {
          let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");
          subClonedRow.find('input[type="text"]').val("");
          subClonedRow.find("select").prop("selectedIndex", 0);
          subTbody.append(subClonedRow);

          // Initialize sub-row visibility
          checkSubRow(this);
        }
      });

      $tbody.append(clonedRow);
    }

    // Initial check for row visibility
    checkRow();

    // Main layer add row
    $tbody.on("click", ".addRow-main", function () {
      let closestTbody = $(this).closest("tbody");
      let templateRow = closestTbody.find("tr.table-space").first();
      let clonedRow = templateRow.clone(true).removeAttr("hidden");

      // Clear main row inputs
      clonedRow.find('input[type="text"]').val("");
      clonedRow.find("select").prop("selectedIndex", 0);

      // For sub-layer: reset to have only one visible row
      clonedRow.find(".sub-table").each(function () {
        let subTbody = $(this).find("tbody");
        let subTemplateRow = subTbody.find("tr").first();

        // Remove all rows except template
        subTbody.find("tr:not(:first)").remove();

        // Create one visible sub-row
        if (subTemplateRow.length) {
          let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");
          subClonedRow.find('input[type="text"]').val("");
          subClonedRow.find("select").prop("selectedIndex", 0);
          subTbody.append(subClonedRow);

          // Initialize sub-row visibility
          checkSubRow(this);
        }
      });

      $(this).closest("tr").after(clonedRow);
      checkRow();
    });

    // Main layer remove row
    $tbody.on("click", ".removeRow-main", function () {
      let closestTbody = $(this).closest("tbody");
      if (closestTbody.find("tr:not([hidden])").length > 1) {
        $(this).closest("tr").remove();
        checkRow();
      }
    });

    $tbody.on("click", ".addRow-sub", function () {
      let subTable = $(this).closest(".sub-table");
      let subTbody = subTable.find("tbody");
      let subTemplateRow = subTbody.find("tr").first();
      let currentRow = $(this).closest("tr");

      // Clone the template row
      let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");

      // let buttonValue = currentRow.find(".ButtonName").val();
      // subClonedRow.find(".ButtonName").val(buttonValue);

      // // Hide elements
      subClonedRow.find("label.buttonName").hide();
      subClonedRow
        .find(".ButtonName")
        .closest(".kintoneplugin-input-outer")
        .css("display", "none");

      // Adjust padding
      subClonedRow.find("td").first().css("padding-left", "192px");

      // Insert after current row
      currentRow.after(subClonedRow);
      checkSubRow(subTable);
    });

    console.log("test phong");

    // Sub-layer remove row
    $tbody.on("click", ".removeRow-sub", function () {
      let subTable = $(this).closest(".sub-table");
      let subTbody = subTable.find("tbody");

      if (subTbody.find("tr:not([hidden])").length > 1) {
        $(this).closest("tr").remove();
        checkSubRow(subTable);
      }
    });
  });

  let GETFIELD = await kintone.api("/k/v1/preview/app/form/fields", "GET", {
    app: kintone.app.getId(),
  });
  console.log("GETFIELD", GETFIELD);
  let fieldsCode = [
    "FILE",
    "DATE",
    "MULTI_LINE_TEXT",
    "DROP_DOWN",
    "RADIO_BUTTON",
    "SINGLE_LINE_TEXT",
    "NUMBER",
    "CHECK_BOX",
    "RICH_TEXT",
    "MULTI_SELECT",
    "TIME",
    "DATETIME",
    "NUMBER",
    "NUMBER",
    "NUMBER",
    "NUMBER",
  ];

  let select = $(".type-select-field-A");
  select.empty();
  select.append('<option value="-----">-----</option>');

  Object.keys(GETFIELD.properties).forEach((code) => {
    const field = GETFIELD.properties[code];

    if (fieldsCode.includes(field.type)) {
      select.append(
        `<option value="${field.code}"  data-type="${field.type}">${field.label}</option>`
      );
    }
  });

  function getPluginConfig() {
    let config = { table: [] };
    const mainRows = document.querySelectorAll(
      "#kintoneplugin-setting-tspace > tr:not([hidden])"
    );

    mainRows.forEach((mainRow) => {
      const subRows = mainRow.querySelectorAll(".sub-table tr:not([hidden])");

      subRows.forEach((subRow) => {
        const buttonName = subRow.querySelector(".ButtonName")?.value || "";
        const InputName = subRow.querySelector("input.InputName")?.value || "";
        const fieldA =
          subRow.querySelector(".type-select-field-A")?.value || "";
        const condition =
          subRow.querySelector(".store-field-select-condition")?.value || "";
        let recreate = false;
        if (condition === "partial") {
          recreate = true;
        } else {
          const recreateBtn = subRow.querySelector(".js-reactios-button");
          recreate = recreateBtn
            ? window.getComputedStyle(recreateBtn).display !== "none"
            : false;
        }

        config.table.push({
          buttonName,
          InputName,
          fieldA,
          condition,
          recreate,
        });
      });
    });

    console.log("getconfig 911", config);

    return config;
  }

  //setConfig
  async function setConfig(CONFIG_JSON) {
    CONFIG_JSON = CONFIG_JSON || { table: [] };

    if (!Array.isArray(CONFIG_JSON.table)) {
      console.error(
        "Invalid configuration data. 'table' is missing or not an array.",
        CONFIG_JSON
      );
      return;
    }
    // Get the main table space
    const tspace = document.getElementById("kintoneplugin-setting-tspace");

    // Validate template row
    const mainRowTemplate = tspace.querySelector("tr.table-space[hidden]");
    if (!mainRowTemplate) {
      console.error("Main row template not found.");
      return;
    }

    // Clear existing rows before adding new ones
    tspace.querySelectorAll("tr:not([hidden])").forEach((row) => row.remove());

    // for (const mainTableItem of CONFIG_JSON.table) {
    const mainRow = mainRowTemplate.cloneNode(true);
    mainRow.hidden = false;

    // Get the sub-table body and template row
    const subTableBody = mainRow.querySelector(".sub-table tbody");
    const subRowTemplate = subTableBody.querySelector("tr.table-space[hidden]");
    if (!subRowTemplate) {
      console.error("Sub-row template not found.");
      return;
    }
    for (const [index, subItem] of CONFIG_JSON.table.entries()) {
      const subRow = subRowTemplate.cloneNode(true);
      subRow.hidden = false;
      console.log("index", index);

      subRow.querySelector(".ButtonName").value = subItem.buttonName || "";
      subRow.querySelector("input.InputName").value = subItem.InputName || "";
      // subRow.querySelector(".appID").value = subItem.appID || "";

      subRow.querySelector(".type-select-field-A").value =
        subItem.fieldA || "-----";

      subRow.querySelector(".store-field-select-condition").value =
        subItem.condition || "-----";

      const recreateButton = subRow.querySelector(".js-reactios-button");
      if (subItem.recreate) {
        recreateButton.style.display = "inline-block";
      } else {
        recreateButton.style.display = "none";
      }

      // Convert to jQuery object to apply additional styling
      const subClonedRow = $(subRow);

      if (index !== 0) {
        // Hide label.buttonName
        subClonedRow.find("label.buttonName").hide();

        // Hide the container of the .ButtonName input
        subClonedRow
          .find(".ButtonName")
          .closest(".kintoneplugin-input-outer")
          .css("display", "none");
        subClonedRow.find("td").first().css("padding-left", "192px");
      }
      subTableBody.appendChild(subRow);
    }

    tspace.appendChild(mainRow);
    // }

    checkRow();
    $("#kintoneplugin-setting-tspace .sub-table").each(function () {
      checkSubRow($(this));
    });
  }

  await setConfig(CONFIG_JSON);

  //Reactios function
  $(document).on("change", ".store-field-select-condition", function () {
    const value = $(this).val().toLowerCase();
    console.log("value", value);

    const saveButton = $(this).closest(".row").find(".js-reactios-button");

    if (value === "partial") {
      saveButton.show();
    } else {
      saveButton.hide();
    }
  });

  //click Button reactios
  $(document).on("click", ".js-reactios-button", async function () {
    const appId = kintone.app.getId();

    try {
      const records = await getAllRecords(appId);
      console.log("Total records:", records);
      console.log("Total records:", records.length);

      for (const [index, record] of records.entries()) {
        const textField = record.Text;

        if (textField && textField.type === "SINGLE_LINE_TEXT") {
          const originalValue = textField.value || "";
          const formattedValue = "_," + originalValue.split("").join(",");

          const recordId = record.$id.value;

          try {
            await kintone.api(kintone.api.url("/k/v1/record", true), "PUT", {
              app: appId,
              id: recordId,
              record: {
                Text: {
                  value: formattedValue,
                },
              },
            });

            console.log(
              `Record ${index + 1} updated successfully. Value: ${formattedValue}`
            );
          } catch (updateError) {
            console.error(`Error updating record`, updateError);
          }
        } else {
          console.log(`Text field is missing or not SINGLE_LINE_TEXT`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  });

  // check value selection in the dropdown dont repeat
  function checkDuplicateSelect() {
    const selected = [];
    let isDuplicate = false;

    $(".type-select-field-A").each(function () {
      const val = $(this).val();
      if (val !== "-----") {
        if (selected.includes(val)) {
          isDuplicate = true;
          return false; // break loop
        }
        selected.push(val);
      }
    });

    console.log("selected", selected);
    return isDuplicate;
  }

  // Save plugin config when clicking the save button
  $("#button_save").on("click", async function () {
    if (checkDuplicateSelect()) {
      Swal10.fire({
        icon: "error",
        title: "Duplicate Found",
        text: "Each 'Target Field Selection' must be unique. Please remove duplicates.",
      });
      return;
    }

    const configObj = getPluginConfig();
    console.log("configObj", configObj);

    let config = JSON.stringify(configObj);
    console.log("config", config);

    kintone.plugin.app.setConfig({ config }, () => {
      console.log("Config saved successfully!");
      window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
    });
  });

  $("#cancel").on("click", function () {
    window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
  });

  //Export Function
  $("#export").on("click", async function () {
    Swal10.fire({
      customClass: {
        confirmButton: "custom-confirm-button",
        cancelButton: "custom-cancel-button",
      },
      position: "center",
      icon: "info",
      text: "Do you want to export configuration information?",
      confirmButtonColor: "#3498db",
      showCancelButton: true,
      cancelButtonColor: "#f7f9fa",
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let hasError = await getPluginConfig();
        console.log("hasError", hasError);
        if (!hasError) return;
        let data = await getPluginConfig();
        console.log("Get data ", data);
        let blob = new Blob([JSON.stringify(data)], {
          type: "application/json",
        });
        let url = URL.createObjectURL(blob);
        let date = new Date();
        let year = date.getFullYear();
        let month = ("0" + (date.getMonth() + 1)).slice(-2);
        let day = ("0" + date.getDate()).slice(-2);
        let hours = ("0" + date.getHours()).slice(-2);
        let minutes = ("0" + date.getMinutes()).slice(-2);
        let formattedDateTime = `${year}-${month}-${day} ${hours}-${minutes}.json`;
        let elementDownload = $("<a>")
          .attr("href", url)
          .attr("download", formattedDateTime)
          .appendTo("body");
        elementDownload[0].click();
        elementDownload.remove();
      }
    });
  });

  // function check structure and data import
  async function compareConfigStructures(dataImport) {
    let errorTexts = [];
    let configStructure = {
      table: [
        {
          buttonName: "string",
          InputName: "string",
          fieldA: "string",
          condition: "string",
        },
      ],
    };

    function checkType(structure, data) {
      console.log("data911-Test", data);
      console.log("structure", structure);
      if (Array.isArray(structure)) {
        if (!Array.isArray(data)) {
          errorTexts.push("Expected an array but got something else.");
          return false;
        }
        for (let item of data) {
          if (!checkType(structure[0], item)) {
            errorTexts.push("Array element structure mismatch.");
            return false;
          }
        }
        return true;
      }

      // if (typeof structure === "object" && structure !== null) {
      //   if (typeof data !== "object" || data === null || Array.isArray(data)) {
      //     errorTexts.push("Expected an object.");
      //     return false;
      //   }
      //   for (let key in structure) {
      //     if (!(key in data)) {
      //       errorTexts.push(`Missing key: ${key}`);
      //       return false;
      //     }
      //     if (!checkType(structure[key], data[key])) {
      //       return false;
      //     }
      //   }
      //   for (let key in data) {
      //     if (!(key in structure)) {
      //       errorTexts.push(`Unexpected key: ${key}`);
      //       return false;
      //     }
      //   }
      //   return true;
      // }

      // if (typeof structure === "string") {
      //   if (typeof data !== structure) {
      //     errorTexts.push(
      //       `Type mismatch. Expected ${structure}, got ${typeof data}`
      //     );
      //     return false;
      //   }
      // }
      return true;
    }

    function checkAllCases(dataImport) {
      if (Object.keys(dataImport).length === 0) {
        errorTexts.push("Configuration object is empty.");
        return false;
      }
      return checkType(configStructure, dataImport);
    }

    let isValid = checkAllCases(dataImport);
    if (!isValid) {
      let customClass = $("<div></div>")
        .text("Failed to load configuration information.")
        .css("font-size", "18px");

      let errors = errorTexts.join("<br>");
      let customClassText = $("<div></div>")
        .html(errors)
        .css("font-size", "14px");

      await Swal10.fire({
        icon: "error",
        title: customClass.prop("outerHTML"),
        html: customClassText.prop("outerHTML"),
        confirmButtonColor: "#3498db",
      });
      return false;
    }

    return true;
  }

  // Import Function
  $("#import").on("click", function () {
    $("#fileInput").click();
  });
  $("#fileInput").on("change", function (event) {
    let file = event.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = async (e) => {
        let fileContent = e.target.result;
        let dataImport;
        try {
          dataImport = JSON.parse(fileContent);
        } catch (error) {
          let customClass = $("<div></div>")
            .html(
              `The file format for reading configuration information is JSON format<br>  Please check the file format extension.`
            )
            .css("font-size", "14px");
          await Swal10.fire({
            icon: "error",
            html: customClass.prop("outerHTML"),
            confirmButtonColor: "#3498db",
          });

          $("#fileInput").val("");
          return;
        }

        let checkCompareConfig = await compareConfigStructures(dataImport);
        if (!checkCompareConfig) {
          $("#fileInput").val("");
          return;
        } else {
          await setConfig(dataImport);
          Swal10.fire({
            position: "center",
            icon: "success",
            text: "Configuration information was successfully imported",
            showConfirmButton: true,
          });
          $("#fileInput").val("");
        }
      };
      reader.readAsText(file);
    } else {
      Swal10.fire({
        position: "center",
        text: "Select the file you want to import",
        confirmButtonColor: "#3498db",
        confirmButtonText: "OK",
      });
      $("#fileInput").val("");
    }
  });

  //   window.RsComAPI.hideSpinner();
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
