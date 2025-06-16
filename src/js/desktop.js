(function ($, Swal10, PLUGIN_ID) {
  kintone.events.on("app.record.index.show", (events) => {
    let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!CONFIG) return;
    let CONFIG_JSON = JSON.parse(CONFIG.config || "{}");
    console.log("CONFIG_JSON", CONFIG_JSON);
    let BUTTONNAME = CONFIG_JSON.table
      .filter((item) => item.buttonName && item.buttonName.trim() !== "")
      .map((item) => item.buttonName);
    let records = events.records;
    console.log("records", records);
    const spaceEl = kintone.app.getHeaderSpaceElement();
    if (!spaceEl)
      throw new Error("The header element is unavailable on this page.");

    if ($(spaceEl).find(".custom-space-el").length > 0) {
      return;
    }

    const div = $("<div>").addClass("custom-space-el").css({
      margin: "10px 0",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    });

    let savedValues = {};
    try {
      savedValues =
        JSON.parse(localStorage.getItem("myPluginInputValues")) || {};
    } catch (e) {
      savedValues = {};
    }

    $.each(CONFIG_JSON.table || [], function (index, item) {
      let labelName = item?.InputName;
      const wrapper = $("<div>").css({ margin: "10px 0" });
      let label = $("<label>")
        .attr("for", `dynamic-input-${index}`)
        .text(labelName + ":")
        .css({ marginRight: "10px" });
      wrapper.append(label);
      wrapper.append("<br>");
      let input;

      switch (item.fieldA) {
        case "Date":
          input = $('<input type="date">');
          break;
        case "Time":
          input = $('<input type="time">');
          break;
        case "Text":
        case "Rich_text":
          input = $('<input type="text">');
          break;
        case "Number":
          input = $('<input type="number">');
          input.on("input", function () {
            const raw = $(this).val();
            if (raw === "") return;
            const val = parseInt($(this).val(), 10);
            if (val !== 1 && val <= 0) {
              $(this).val(0);
            }
          });
          break;
        case "Drop_down": {
          input = $("<select>")
            .addClass("type-select-field-A kintoneplugin-input-text")
            .attr("id", `dynamic-input-${index}`)
            .attr("name", `dynamic-input-${index}`)
            .css({
              padding: "5px",
              marginLeft: "5px",
              width: "150px",
              borderRadius: "10px",
            })
            .append('<option value="-----">-----</option>')
            .append('<option value="sample1">sample1</option>')
            .append('<option value="sample2">sample2</option>')
            .append('<option value="sample3">sample3</option>');
          break;
        }
        default:
          input = $('<input type="text">');
      }

      if (item.fieldA !== "Drop_down") {
        input
          .attr("id", `dynamic-input-${index}`)
          .attr("name", `dynamic-input-${index}`)
          .css({
            padding: "5px",
            marginLeft: "5px",
            width: "150px",
            borderRadius: "10px",
          })
          .addClass("kintoneplugin-input-text");
      } else {
        input
          .attr("id", `dynamic-input-${index}`)
          .attr("name", `dynamic-input-${index}`)
          .css({ padding: "5px", marginLeft: "5px", borderRadius: "10px" });
      }

      if (item.fieldA === "Date_and_time") {
        const dateVal = savedValues[`dynamic-input-${index}-date`];
        const timeVal = savedValues[`dynamic-input-${index}-time`];
        input.find(`#dynamic-input-${index}-date`).val(dateVal);
        input.find(`#dynamic-input-${index}-time`).val(timeVal);
      } else {
        input.val(savedValues[`dynamic-input-${index}`]);
      }

      // Set input value from savedValues if present
      if (savedValues.hasOwnProperty(`dynamic-input-${index}`)) {
        input.val(savedValues[`dynamic-input-${index}`]);
      }
      wrapper.append(input);
      div.append(wrapper);
    });
    let button = $("<button>")
      .addClass("kintoneplugin-button-dialog-ok")
      .text(`${BUTTONNAME}`)
      .css({
        border: "none",
        marginTop: "23px",
        width: "150px",
        borderRadius: "10px",
      });
    console.log("item?.buttonName", BUTTONNAME);
    div.append(button);
    $(spaceEl).append(div);

    // Search button click handler
    let valuesToSave = {};
    button.on("click", async function () {
      $.each(CONFIG_JSON.table || [], function (index, item) {
        const val = $(`#dynamic-input-${index}`).val();
        valuesToSave[`dynamic-input-${index}`] = val;
      });
      localStorage.setItem("myPluginInputValues", JSON.stringify(valuesToSave));

      let queryParts = [];

      // Loop inputs to build query parts
      $.each(CONFIG_JSON.table || [], function (index, item) {
        const value = $(`#dynamic-input-${index}`).val();
        console.log("Need to test data", value);

        if (value && value !== "" && value !== "-----") {
          const fieldCode = item.fieldA;
          if (!fieldCode) {
            console.warn(`Missing fieldCode for item at index ${index}`);
            return;
          }
          console.log(fieldCode);
          let queryPart = "";
          switch (item.condition) {
            case "partial":
              const escapedValue = value
                .replace(/"/g, '\\"')
                .replace(/\s+/g, "");
              const joinedValue = escapedValue.split("").join(",");
              console.log("joinedValue", joinedValue);
              queryPart = `${fieldCode} like "_,${joinedValue}"`;
              // queryPart = `_,(${fieldCode} like "${escapedValue}.join(",")")`;
              break;
            case "initial":
              const escapedValues = value
                .replace(/"/g, '\\"')
                .replace(/\s+/g, "");
              queryPart = `(${fieldCode} like "${escapedValues}")`;
              break;
            // case "Text":
            case "Rich_text":
              queryPart = `(${fieldCode} like "${value}")`;
              break;

            case "Number":
              queryPart = `(${fieldCode} = ${value})`;
              break;

            case "Radio_button":
            case "Drop_down":
              queryPart = `(${fieldCode} in ("${value}"))`;
              break;

            case "Check_box":
            case "Multi_choice":
              const values = value
                .split(",")
                .map((v) => `"${v.trim()}"`)
                .join(", ");
              console.log("values", values);
              queryPart = `(${fieldCode} in (${values}))`;
              break;

            case "Date":
            case "Time":
            case "Date_and_time":
              console.log("value", value);
              queryPart = `(${fieldCode} >= "${value}") and (${fieldCode} <= "${value}")`;
              break;

            default:
              console.warn(`Unhandled field type: ${fieldCode}`);
              return;
          }

          // querys += querys ? ` and ${queryPart}` : queryPart;
          // queryParts.push(queryPart);

          queryParts.push(queryPart);
        }
      });
      console.log("queryParts", queryParts);

      if (queryParts.length === 0) {
        Swal10.fire({
          icon: "error",
          title: "Enter the value please!",
          text: "Please enter at least one search condition.",
        });
        return;
      }

      // Combine with AND

      let querys = queryParts.join(" and ");
      const baseUrl = window.location.href.match(/\S+\//)[0];
      // if (!querys) {
      //   alert("Please enter at least one search condition.");
      //   return;
      // }

      const encodedQuery = encodeURIComponent(querys);
      const url = baseUrl + "?query=" + encodedQuery;
      window.location.href = url;
    });
    return events;
  });
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
